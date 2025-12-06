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
    setHydrated(true);
  }, []);

  // STEP 2 — Check domain and authentication (only after hydration)
  useEffect(() => {
    if (!hydrated) return;

    if (typeof window === "undefined") {
      setKeyLoaded(true);
      return;
    }

    const hostname = window.location.hostname;
    const isVaultDomain = hostname === "vault.idpassku.com" || hostname.includes("vault.");
    const isMainDomain = hostname === "idpassku.com" || (!isVaultDomain && !hostname.includes("localhost") && !hostname.includes("127.0.0.1"));

    // Safety check: If somehow we're on main domain (middleware should have redirected)
    // Logout and redirect to login
    if (isMainDomain) {
      if (token) {
        console.warn("Unauthorized access: Dashboard accessed from main domain. Logging out...");
        keyManager.clearKey();
        logout();
      }
      window.location.replace("https://idpassku.com/login");
      return;
    }

    // If no token, redirect to login
    if (!token) {
      setKeyLoaded(true);
      window.location.replace("https://idpassku.com/login");
      return;
    }

    // If we have token and are on vault domain, proceed with key loading
    if (token && isVaultDomain) {
      keyManager.loadKeyFromSession().then((success) => {
        if (success) {
          console.log("Encryption key restored from session");
          setKeyLoaded(true);
        } else {
          console.log("No encryption key in session - forcing re-login");
          logout();
          window.location.replace("https://idpassku.com/login");
        }
      });
    } else if (token && !isVaultDomain && !isMainDomain) {
      // If we have token but not on vault domain (e.g., localhost)
      // Redirect to vault domain
      window.location.replace("https://vault.idpassku.com/dashboard");
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
