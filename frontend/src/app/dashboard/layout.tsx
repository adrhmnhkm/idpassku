"use client";

import { useAuth } from "@/lib/store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { keyManager } from "@/lib/crypto";
import { useAutoLock } from "@/hooks/use-auto-lock";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);

  // Initialize Auto-Lock (15 minutes)
  useAutoLock(15 * 60 * 1000);

  const [hydrated, setHydrated] = useState(false);
  const [keyLoaded, setKeyLoaded] = useState(false);

  // STEP 1 — Hydrate
  useEffect(() => {
    console.log("[DASHBOARD LAYOUT] 🟢 Hydrating...");
    setHydrated(true);
  }, []);

  // STEP 2 — Check authentication and load encryption key (only after hydration)
  // NOTE: Domain check is handled by middleware, we don't need to check here
  // to avoid race conditions and multiple redirects
  useEffect(() => {
    console.log("[DASHBOARD LAYOUT] 🔍 Checking auth state...", {
      hydrated,
      hasToken: !!token,
      hostname: typeof window !== "undefined" ? window.location.hostname : "SSR",
      pathname: typeof window !== "undefined" ? window.location.pathname : "SSR",
    });

    if (!hydrated) {
      console.log("[DASHBOARD LAYOUT] ⏳ Waiting for hydration...");
      return;
    }

    if (typeof window === "undefined") {
      console.log("[DASHBOARD LAYOUT] ⚠️ SSR - skipping client-side checks");
      setKeyLoaded(true);
      return;
    }

    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // If no token, redirect to login
    if (!token) {
      console.warn("[DASHBOARD LAYOUT] 🔴 No token found - redirecting to login", {
        hostname,
        pathname,
      });
      setKeyLoaded(true);
      window.location.replace("https://idpassku.com/login");
      return;
    }

    // If we have token, proceed with key loading
    // We assume we're on the correct domain (vault.idpassku.com) because middleware handles redirects
    if (token) {
      console.log("[DASHBOARD LAYOUT] 🔑 Token found - loading encryption key...", {
        hostname,
        pathname,
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
          window.location.replace("https://idpassku.com/login");
        }
      }).catch((error) => {
        console.error("[DASHBOARD LAYOUT] ❌ Error loading encryption key:", error, {
          hostname,
          pathname,
        });
        logout();
        window.location.replace("https://idpassku.com/login");
      });
    }
  }, [hydrated, token, logout, router]);

  // STEP 4 — Render "blank" while hydration/key loading is happening
  if (!hydrated || !keyLoaded) {
    return (
      <div className="min-h-screen bg-emerald-dark-gradient text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-emerald-300 text-lg">Initializing Secure Vault...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null; // Redirect is on the way
  }

  // STEP 5 — Normal render
  return (
    <div className="flex min-h-screen bg-emerald-dark-gradient text-slate-100">
      <Sidebar />
      <main className="flex-1 p-6 bg-emerald-radial-gradient">{children}</main>
    </div>
  );
}
