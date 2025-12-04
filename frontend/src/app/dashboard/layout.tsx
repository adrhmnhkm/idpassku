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

  // STEP 2 — Load encryption key from session if available
  useEffect(() => {
    if (hydrated && token) {
      keyManager.loadKeyFromSession().then((success) => {
        if (success) {
          console.log("Encryption key restored from session");
          setKeyLoaded(true);
        } else {
          console.log("No encryption key in session - forcing re-login");
          // If we have a token but no key, we must force re-login to generate the key
          // because we cannot decrypt anything without it.
          logout();
          router.replace("/login");
        }
      });
    } else if (hydrated && !token) {
      // No token, just mark key check as done (will redirect anyway)
      setKeyLoaded(true);
    }
  }, [hydrated, token, logout, router]);

  // STEP 3 — Redirect ONLY after hydration
  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

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
