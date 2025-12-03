const API_URL = "http://localhost:5000";

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('login-form');
    const twoFaForm = document.getElementById('2fa-form');
    const authenticatedDiv = document.getElementById('authenticated');

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const twoFaInput = document.getElementById('2fa-code');

    const loginBtn = document.getElementById('login-btn');
    const verifyTwoFaBtn = document.getElementById('verify-2fa-btn');
    const cancelTwoFaBtn = document.getElementById('cancel-2fa-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const statusDiv = document.getElementById('status');
    const userEmailSpan = document.getElementById('user-email');

    // Store credentials temporarily for 2FA step
    let tempEmail = '';
    let tempPassword = '';

    // Check if already logged in
    const { token, user } = await chrome.storage.local.get(['token', 'user']);

    if (token && user) {
        showAuthenticated(user);
    }

    loginBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showStatus('Please fill in all fields', 'error');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        try {
            await performLogin(email, password);
        } catch (error) {
            console.error("Login error:", error);
            showStatus(error.message, 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });

    verifyTwoFaBtn.addEventListener('click', async () => {
        const code = twoFaInput.value;
        if (!code) {
            showStatus('Please enter the code', 'error');
            return;
        }

        verifyTwoFaBtn.disabled = true;
        verifyTwoFaBtn.textContent = 'Verifying...';

        try {
            await performLogin(tempEmail, tempPassword, code);
        } catch (error) {
            console.error("2FA error:", error);
            showStatus(error.message, 'error');
        } finally {
            verifyTwoFaBtn.disabled = false;
            verifyTwoFaBtn.textContent = 'Verify';
        }
    });

    cancelTwoFaBtn.addEventListener('click', () => {
        showLogin();
        tempEmail = '';
        tempPassword = '';
    });

    logoutBtn.addEventListener('click', async () => {
        await chrome.storage.local.clear();
        showLogin();
    });

    async function performLogin(email, password, twoFactorToken = null) {
        const body = { email, password };
        if (twoFactorToken) {
            body.twoFactorToken = twoFactorToken;
        }

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log("Login response data:", data);

        if (!response.ok && response.status !== 202) {
            throw new Error(data.message || 'Login failed');
        }

        // Handle 2FA requirement
        if (response.status === 202 && data.requireTwoFactor) {
            tempEmail = email;
            tempPassword = password;
            showTwoFaForm();
            showStatus('Please enter 2FA code', 'success');
            return;
        }

        // Handle success
        if (data.accessToken && data.user) {
            // Derive encryption key from password
            // Note: We use the password entered by the user (or tempPassword if 2FA was used)
            const passwordToUse = password || tempPassword;

            try {
                const key = await deriveKey(passwordToUse);
                const exportedKey = await exportKey(key);

                // Calculate token expiry (e.g., 1 hour from now)
                const tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour
                if (data.expiresIn) {
                    // Use server-provided expiry if available
                    const expiryMs = data.expiresIn * 1000;
                    if (expiryMs < (60 * 60 * 1000)) { // Only if shorter than default
                        tokenExpiry = Date.now() + expiryMs;
                    }
                }

                await chrome.storage.local.set({
                    token: data.accessToken,
                    user: data.user,
                    encryptionKey: exportedKey,
                    tokenExpiry: tokenExpiry,
                    refreshToken: data.refreshToken || null
                });

                // After successful login + key setup, trigger an initial vault sync
                try {
                    chrome.runtime.sendMessage({ type: 'TRIGGER_VAULT_SYNC' }, (resp) => {
                        if (resp && resp.ok) {
                            console.log("Initial vault sync completed.");
                        } else if (resp && resp.error) {
                            console.warn("Vault sync error:", resp.error);
                        }
                    });
                } catch (e) {
                    console.warn("Failed to trigger initial vault sync:", e);
                }

                showAuthenticated(data.user);
                showStatus('Login successful!', 'success');
            } catch (err) {
                console.error("Key derivation failed:", err);
                showStatus("Login successful, but failed to setup encryption.", "error");
            }

            // Clear temp creds
            tempEmail = '';
            tempPassword = '';
        } else {
            console.error("Invalid user data received:", data);
            showStatus('Login failed: Invalid response', 'error');
        }
    }

    function showAuthenticated(user) {
        if (!user || !user.email) {
            console.error("Invalid user object:", user);
            showStatus("Login error: Invalid user data", "error");
            return;
        }
        loginForm.classList.add('hidden');
        twoFaForm.classList.add('hidden');
        authenticatedDiv.classList.remove('hidden');
        userEmailSpan.textContent = user.email;
    }

    function showLogin() {
        loginForm.classList.remove('hidden');
        twoFaForm.classList.add('hidden');
        authenticatedDiv.classList.add('hidden');
        emailInput.value = '';
        passwordInput.value = '';
        twoFaInput.value = '';
        statusDiv.textContent = '';
    }

    function showTwoFaForm() {
        loginForm.classList.add('hidden');
        twoFaForm.classList.remove('hidden');
        authenticatedDiv.classList.add('hidden');
        twoFaInput.value = '';
        twoFaInput.focus();
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = type;
    }
});
