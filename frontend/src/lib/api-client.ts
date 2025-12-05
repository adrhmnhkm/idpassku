import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuth } from "./store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor to attach Authorization header
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuth.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for 401 handling and token refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // Handle network errors
        if (!error.response) {
            console.error("Network error:", error.message);
            // Return a more descriptive error
            return Promise.reject({
                ...(error as any),
                message: "Network error: Unable to reach the server. Please check your connection.",
                isNetworkError: true,
            });
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return apiClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = useAuth.getState().refreshToken;

            if (!refreshToken) {
                // No refresh token, logout and redirect
                useAuth.getState().logout();
                if (typeof window !== "undefined") {
                    // Use replace to avoid adding to history
                    window.location.replace("/login");
                }
                return Promise.reject({
                    ...(error as any),
                    message: "Session expired. Please login again.",
                    isAuthError: true,
                });
            }

            try {
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = response.data;
                useAuth.getState().setToken(accessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }

                processQueue(null, accessToken);
                isRefreshing = false;

                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as AxiosError, null);
                isRefreshing = false;

                // Refresh failed, logout and redirect
                useAuth.getState().logout();
                if (typeof window !== "undefined") {
                    window.location.replace("/login");
                }

                const authError = refreshError as AxiosError;
                return Promise.reject({
                    ...authError,
                    message: "Session expired. Please login again.",
                    isAuthError: true,
                });
                }
        }

        // Handle other HTTP errors
        const status = error.response?.status;
        if (status === 403) {
            return Promise.reject({
                ...(error as any),
                message: "Access forbidden. You don't have permission to perform this action.",
            });
        }
        if (status === 404) {
            return Promise.reject({
                ...(error as any),
                message: "Resource not found.",
            });
            }
        if (status >= 500) {
            return Promise.reject({
                ...(error as any),
                message: "Server error. Please try again later.",
            });
        }

        return Promise.reject(error);
    }
);
