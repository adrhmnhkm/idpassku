"use client";

import { useAuth } from "@/lib/store";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import { keyManager } from "@/lib/crypto";
import { useAutoLock } from "@/hooks/use-auto-lock";
import { getMainDomainUrl } from "@/lib/url-helper";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);

  // Initialize Auto-Lock (15 minutes)
  useAutoLock(15 * 60 * 1000);

  const [hydrated, setHydrated] = useState(false);
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [zustandReady, setZustandReady] = useState(false);
  const [missingToken, setMissingToken] = useState(false);
  const [tokenExtracted, setTokenExtracted] = useState(false);

  // STEP 1 — Extract token from URL if present (from login redirect) and store in vault localStorage
  // This MUST happen first, before any auth checks
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if token is in URL (from login redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    const refreshTokenFromUrl = urlParams.get("refreshToken");

    if (tokenFromUrl) {
      console.log("[DASHBOARD LAYOUT] 🔑 Token found in URL, storing in vault localStorage...", {
        tokenLength: tokenFromUrl.length,
        hasRefreshToken: !!refreshTokenFromUrl,
        hostname: window.location.hostname,
      });
      
      // Immediately set token in Zustand
      const setToken = useAuth.getState().setToken;
      setToken(tokenFromUrl);
      
      if (refreshTokenFromUrl) {
        const setRefreshToken = useAuth.getState().setRefreshToken;
        setRefreshToken(refreshTokenFromUrl);
      }

      // Wait for Zustand to persist and verify
      const verifyAndClean = async () => {
        let retries = 0;
        const maxRetries = 15; // Increase retries even more
        
        while (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 150)); // Increase delay
          
          const stored = localStorage.getItem("indovault-auth");
          const parsed = stored ? JSON.parse(stored) : null;
          const storedToken = parsed?.state?.token;
          const tokenStored = !!storedToken && storedToken === tokenFromUrl;
          
          console.log(`[DASHBOARD LAYOUT] 📦 Token storage verification (attempt ${retries + 1}/${maxRetries}):`, {
            tokenStored,
            hasStorage: !!stored,
            tokenMatches: storedToken === tokenFromUrl,
            storedTokenLength: storedToken?.length,
            expectedTokenLength: tokenFromUrl.length,
          });

          if (tokenStored) {
            // Remove token from URL for security
            urlParams.delete("token");
            urlParams.delete("refreshToken");
            const newUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "");
            window.history.replaceState({}, "", newUrl);
            console.log("[DASHBOARD LAYOUT] ✅ Token stored and URL cleaned - proceeding to auth check");
            setTokenExtracted(true);
            return;
          }
          
          // If not stored yet, retry setting
          if (retries < maxRetries - 1) {
            console.log(`[DASHBOARD LAYOUT] ⚠️ Token not stored yet (attempt ${retries + 1}), retrying set...`);
            setToken(tokenFromUrl);
            if (refreshTokenFromUrl) {
              useAuth.getState().setRefreshToken(refreshTokenFromUrl);
            }
          }
          
          retries++;
        }
        
        // If still not stored after all retries, check one more time
        const finalCheck = localStorage.getItem("indovault-auth");
        const finalParsed = finalCheck ? JSON.parse(finalCheck) : null;
        const finalToken = finalParsed?.state?.token;
        
        if (finalToken && finalToken === tokenFromUrl) {
          console.log("[DASHBOARD LAYOUT] ✅ Token found in final check - proceeding");
          urlParams.delete("token");
          urlParams.delete("refreshToken");
          const newUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "");
          window.history.replaceState({}, "", newUrl);
          setTokenExtracted(true);
        } else {
          // If still not stored, proceed anyway - token is in URL and will be checked in STEP 2
          console.error("[DASHBOARD LAYOUT] ⚠️ Token not stored after all retries, but proceeding (token in URL will be checked in STEP 2)", {
            finalTokenExists: !!finalToken,
            finalTokenMatches: finalToken === tokenFromUrl,
          });
          // Don't clean URL yet - let STEP 2 handle it
          setTokenExtracted(true);
        }
      };

      verifyAndClean();
    } else {
      // No token in URL, proceed normally
      setTokenExtracted(true);
    }
  }, []);

  // STEP 1b — Wait for token extraction and Zustand to hydrate from localStorage
  useEffect(() => {
    if (!tokenExtracted) {
      console.log("[DASHBOARD LAYOUT] ⏳ Waiting for token extraction from URL...");
      return;
    }

    console.log("[DASHBOARD LAYOUT] 🟢 Starting hydration...");
    
    // Check if Zustand has loaded from localStorage
    const checkZustandReady = () => {
      try {
        // Check localStorage directly as fallback
        const stored = localStorage.getItem("indovault-auth");
        const parsed = stored ? JSON.parse(stored) : null;
        const hasTokenInStorage = parsed?.state?.token;
        
        console.log("[DASHBOARD LAYOUT] 📦 Zustand storage check:", {
          hasStorage: !!stored,
          hasTokenInStorage: !!hasTokenInStorage,
          tokenFromZustand: !!token,
        });

        // If we have token in storage but not in Zustand yet, wait a bit more
        if (hasTokenInStorage && !token) {
          console.log("[DASHBOARD LAYOUT] ⏳ Token in storage but Zustand not ready yet, waiting...");
          setTimeout(checkZustandReady, 100);
          return;
        }

        // Zustand is ready
        setZustandReady(true);
        setHydrated(true);
        console.log("[DASHBOARD LAYOUT] ✅ Zustand ready:", {
          tokenFromZustand: !!token,
          tokenFromStorage: !!hasTokenInStorage,
        });
      } catch (error) {
        console.error("[DASHBOARD LAYOUT] ❌ Error checking Zustand:", error);
        setZustandReady(true);
        setHydrated(true);
      }
    };

    // Give Zustand a moment to hydrate
    setTimeout(checkZustandReady, 50);
  }, [token, tokenExtracted]);

  // STEP 2 — Check authentication and load encryption key (only after hydration AND token extraction)
  // NOTE: Domain check is handled by middleware, we don't need to check here
  // to avoid race conditions and multiple redirects
  useEffect(() => {
    console.log("[DASHBOARD LAYOUT] 🔍 Checking auth state...", {
      hydrated,
      zustandReady,
      tokenExtracted,
      hasToken: !!token,
      hostname: typeof window !== "undefined" ? window.location.hostname : "SSR",
      pathname: typeof window !== "undefined" ? window.location.pathname : "SSR",
    });

    // CRITICAL: Wait for token extraction to complete first
    if (!tokenExtracted) {
      console.log("[DASHBOARD LAYOUT] ⏳ Waiting for token extraction from URL...");
      return;
    }

    if (!hydrated || !zustandReady) {
      console.log("[DASHBOARD LAYOUT] ⏳ Waiting for hydration/Zustand...");
      return;
    }

    if (typeof window === "undefined") {
      console.log("[DASHBOARD LAYOUT] ⚠️ SSR - skipping client-side checks");
      setKeyLoaded(true);
      return;
    }

    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // Double-check localStorage and URL params as fallback before redirecting
    let finalToken = token;
    
    // CRITICAL: Check URL params first (token might be in URL from login redirect)
    // This is a fallback in case STEP 1 didn't catch it
    if (!finalToken && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");
      if (tokenFromUrl) {
        console.log("[DASHBOARD LAYOUT] 🔑 Token found in URL params (fallback), extracting now...");
        const setToken = useAuth.getState().setToken;
        setToken(tokenFromUrl);
        finalToken = tokenFromUrl;
        
        const refreshTokenFromUrl = urlParams.get("refreshToken");
        if (refreshTokenFromUrl) {
          useAuth.getState().setRefreshToken(refreshTokenFromUrl);
        }
        
        // Wait a bit for Zustand to persist, then clean URL
        setTimeout(() => {
          urlParams.delete("token");
          urlParams.delete("refreshToken");
          const newUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "");
          window.history.replaceState({}, "", newUrl);
          console.log("[DASHBOARD LAYOUT] ✅ Token extracted from URL (fallback) and URL cleaned");
        }, 200);
      }
    }
    
    if (!finalToken) {
      try {
        // Check localStorage first
        const stored = localStorage.getItem("indovault-auth");
        console.log("[DASHBOARD LAYOUT] 🔍 Checking localStorage:", {
          hasStorage: !!stored,
          storageLength: stored?.length,
        });
        
        if (stored) {
          const parsed = JSON.parse(stored);
          finalToken = parsed?.state?.token || null;
          console.log("[DASHBOARD LAYOUT] 🔄 Fallback check - token from localStorage:", {
            hasToken: !!finalToken,
            tokenLength: finalToken?.length,
            parsedState: parsed?.state ? Object.keys(parsed.state) : null,
          });
        } else {
          console.warn("[DASHBOARD LAYOUT] ⚠️ No localStorage data found for 'indovault-auth'");
        }

      } catch (error) {
        console.error("[DASHBOARD LAYOUT] ❌ Error reading localStorage:", error);
      }
    } else {
      console.log("[DASHBOARD LAYOUT] ✅ Token found from Zustand or URL");
    }

    // If no token after all checks, wait a bit more (might be still saving from URL)
    if (!finalToken) {
      // Check if token was just extracted from URL - give it time to save
      const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const hasTokenInUrl = urlParams?.has("token");
      
      if (hasTokenInUrl) {
        console.log("[DASHBOARD LAYOUT] ⏳ Token in URL but not in state yet, waiting for save...");
        // Token is being extracted in STEP 1, wait longer for it to complete
        setTimeout(() => {
          const stored = localStorage.getItem("indovault-auth");
          const parsed = stored ? JSON.parse(stored) : null;
          const tokenNow = parsed?.state?.token;
          if (tokenNow) {
            console.log("[DASHBOARD LAYOUT] ✅ Token now available after wait");
            // Trigger re-check by updating state
            setKeyLoaded(false);
          } else {
            console.warn("[DASHBOARD LAYOUT] 🔴 No token found after wait - showing login prompt");
            setMissingToken(true);
            setKeyLoaded(true);
          }
        }, 1000); // Increase wait time to 1 second
        return;
      }
      
      // Only show login prompt if we're sure there's no token and no token in URL
      console.warn("[DASHBOARD LAYOUT] 🔴 No token found after all checks - showing login prompt", {
        hostname,
        pathname,
        tokenFromZustand: !!token,
        hasTokenInUrl,
        note: "This should not happen if token extraction worked correctly",
      });
      setMissingToken(true);
      setKeyLoaded(true);
      return;
    }

    // If we have token, proceed with key loading
    // We assume we're on the correct domain (vault.idpassku.com) because middleware handles redirects
    if (finalToken) {
      console.log("[DASHBOARD LAYOUT] 🔑 Token found - loading encryption key...", {
        hostname,
        pathname,
        tokenSource: token ? "zustand" : "localStorage",
      });
      
      // CRITICAL: Encryption key is stored in sessionStorage which is domain-specific
      // When redirecting from main domain to vault domain, sessionStorage is not accessible
      // So we need to check if key exists, but don't redirect if it doesn't
      // The key will be re-derived when user tries to decrypt items
      keyManager.loadKeyFromSession().then((success) => {
        if (success) {
          console.log("[DASHBOARD LAYOUT] ✅ Encryption key restored from session");
        } else {
          console.warn("[DASHBOARD LAYOUT] ⚠️ No encryption key in session (expected after cross-domain redirect)", {
            hostname,
            pathname,
            note: "Key will be re-derived when needed for decryption",
          });
        }
        // Always set keyLoaded to true, even if key not found
        // Key is only needed when decrypting items, not for dashboard access
        setKeyLoaded(true);
      }).catch((error) => {
        console.error("[DASHBOARD LAYOUT] ❌ Error loading encryption key:", error, {
          hostname,
          pathname,
          note: "Continuing anyway - key will be re-derived when needed",
        });
        // Don't redirect - key is not required for dashboard access
        setKeyLoaded(true);
      });
    }
  }, [hydrated, zustandReady, tokenExtracted, token, logout]);

  // STEP 4 — Render "blank" while token extraction/hydration/key loading is happening
  if (!tokenExtracted || !hydrated || !zustandReady || !keyLoaded) {
    return (
      <div className="min-h-screen bg-emerald-dark-gradient text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-emerald-300 text-lg">Initializing Secure Vault...</p>
        </div>
      </div>
    );
  }

  // Final check - if still no token, don't render (redirect is on the way)
  const hasToken = token || (typeof window !== "undefined" && (() => {
    try {
      const stored = localStorage.getItem("indovault-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        return !!parsed?.state?.token;
      }
    } catch {}
    return false;
  })());

  if (!hasToken || missingToken) {
    console.log("[DASHBOARD LAYOUT] ⏳ No token - showing login prompt");
    return (
      <div className="min-h-screen bg-emerald-dark-gradient text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
          <p className="text-xl font-semibold text-emerald-300">Sesi tidak ditemukan</p>
          <p className="text-sm text-emerald-200/70">
            Silakan login kembali di domain utama untuk melanjutkan.
          </p>
          <button
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30"
            onClick={() => {
              window.location.href = getMainDomainUrl("/login");
            }}
          >
            Buka Halaman Login
          </button>
        </div>
      </div>
    );
  }

  // STEP 5 — Normal render
  return (
    <div className="flex min-h-screen bg-emerald-dark-gradient text-slate-100">
      <Sidebar />
      <main className="flex-1 p-6 bg-emerald-radial-gradient">{children}</main>
    </div>
  );
}
