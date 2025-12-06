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

  // STEP 2 — Check domain IMMEDIATELY on mount (before hydration)
  // This prevents any rendering that would trigger static chunk loading
  useEffect(() => {
    if (typeof window === "undefined") {
      setKeyLoaded(true);
      return;
    }

    const hostname = window.location.hostname;
    const isVaultDomain = hostname === "vault.idpassku.com" || hostname.includes("vault.");
    const isMainDomain = hostname === "idpassku.com" || (!isVaultDomain && !hostname.includes("localhost") && !hostname.includes("127.0.0.1"));

    // CRITICAL: If accessing dashboard from main domain, immediately redirect/logout
    // This must happen BEFORE hydration to prevent static chunk loading
    if (isMainDomain) {
      // Use synchronous script execution to prevent any React rendering
      if (token) {
        // Clear localStorage synchronously
        try {
          localStorage.removeItem("indovault-auth");
          sessionStorage.removeItem("encryption-key");
        } catch (e) {
          // Ignore errors
        }
      }
      // Immediate redirect - this prevents any React components from rendering
      window.location.replace("https://idpassku.com/login");
      return;
    }

    // Continue with hydration check
    if (!hydrated) return;

    // If no token, redirect to login and mark as loaded (redirect will happen)
    if (!token) {
      setKeyLoaded(true); // Mark as loaded so we don't show loading forever
      // Redirect to main domain login
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
          // If we have a token but no key, we must force re-login to generate the key
          // because we cannot decrypt anything without it.
          logout();
          window.location.replace("https://idpassku.com/login");
        }
      });
    } else if (token && !isVaultDomain && !isMainDomain) {
      // If we have token but not on vault domain (and not main domain - already handled above)
      // This handles localhost or other domains - redirect to vault domain
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
