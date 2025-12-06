"use client";

import { useAuth } from "@/lib/store";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import { keyManager } from "@/lib/crypto";
import { useAutoLock } from "@/hooks/use-auto-lock";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);

  // Initialize Auto-Lock (15 minutes)
  useAutoLock(15 * 60 * 1000);

  const [hydrated, setHydrated] = useState(false);
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [zustandReady, setZustandReady] = useState(false);
  const [missingToken, setMissingToken] = useState(false);

  // STEP 1 — Wait for Zustand to hydrate from localStorage
  useEffect(() => {
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
  }, [token]);

  // STEP 2 — Check authentication and load encryption key (only after hydration)
  // NOTE: Domain check is handled by middleware, we don't need to check here
  // to avoid race conditions and multiple redirects
  useEffect(() => {
    console.log("[DASHBOARD LAYOUT] 🔍 Checking auth state...", {
      hydrated,
      zustandReady,
      hasToken: !!token,
      hostname: typeof window !== "undefined" ? window.location.hostname : "SSR",
      pathname: typeof window !== "undefined" ? window.location.pathname : "SSR",
    });

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

    // Double-check localStorage as fallback before redirecting
    let finalToken = token;
    if (!finalToken) {
      try {
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
      console.log("[DASHBOARD LAYOUT] ✅ Token found from Zustand");
    }

    // If no token after all checks, redirect to login (only once)
    if (!finalToken) {
      console.warn("[DASHBOARD LAYOUT] 🔴 No token found after all checks - showing login prompt", {
        hostname,
        pathname,
        tokenFromZustand: !!token,
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
      
      keyManager.loadKeyFromSession().then((success) => {
        if (success) {
          console.log("[DASHBOARD LAYOUT] ✅ Encryption key restored from session");
          setKeyLoaded(true);
        } else {
          console.error("[DASHBOARD LAYOUT] ❌ No encryption key in session - forcing re-login", {
            hostname,
            pathname,
          });
          logout();
          setMissingToken(true);
          setKeyLoaded(true);
        }
      }).catch((error) => {
        console.error("[DASHBOARD LAYOUT] ❌ Error loading encryption key:", error, {
          hostname,
          pathname,
        });
        logout();
        setMissingToken(true);
        setKeyLoaded(true);
      });
    }
  }, [hydrated, zustandReady, token, logout]);

  // STEP 4 — Render "blank" while hydration/key loading is happening
  if (!hydrated || !zustandReady || !keyLoaded) {
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
              window.location.href = "https://idpassku.com/login";
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
