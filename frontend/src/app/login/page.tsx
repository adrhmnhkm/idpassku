"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { useAuth } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { keyManager } from "@/lib/crypto";
import { getVaultDomainUrl, isMainDomain } from "@/lib/url-helper";

export default function LoginPage() {
  const setToken = useAuth((s) => s.setToken);
  const token = useAuth((s) => s.token);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  const [redirectingToVault, setRedirectingToVault] = useState(false);

  // Hydrate check to avoid SSR mismatch
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Login harus di main domain (idpassku.com/login atau localhost)
  // Middleware akan redirect jika diakses dari vault domain

  // Jangan auto-redirect; cukup tandai jika sudah login
  useEffect(() => {
    if (hydrated && token) {
      setAlreadyLoggedIn(true);
    }
  }, [hydrated, token]);

  async function handleLogin() {
    // Login harus di main domain (idpassku.com/login atau localhost)
    if (!isMainDomain()) {
      console.error("[LOGIN] ❌ Not on main domain! Middleware should have redirected.");
      return;
    }

    setLoading(true);
    try {
      console.log("[LOGIN] 🔐 Starting login process...", {
        hostname: typeof window !== "undefined" ? window.location.hostname : "SSR",
        isMainDomain,
      });

      // Step 1: Attempt login (with or without 2FA token)
      const payload: any = { email, password };
      if (twoFactorToken) payload.twoFactorToken = twoFactorToken;

      const res = await api.post("/auth/login", payload);

      // Step 2: Check if 2FA is required
      if (res.status === 202 || res.data.requireTwoFactor) {
        setShowTwoFactor(true);
        setLoading(false);
        return;
      }

      // Login Success
      const { accessToken, refreshToken, user } = res.data;
      
      console.log("[LOGIN] ✅ Login successful, storing tokens...", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hostname: typeof window !== "undefined" ? window.location.hostname : "SSR",
      });
      
      // Store tokens in localStorage (main domain) - will be transferred to vault via URL
      setToken(accessToken);
      
      // Store refresh token if provided
      const setRefreshToken = useAuth.getState().setRefreshToken;
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }

      // Derive encryption key first (this is async and important)
      console.log("[LOGIN] 🔑 Deriving encryption key...");
      await keyManager.deriveKey(password);
      console.log("[LOGIN] ✅ Encryption key derived");

      // Force Zustand to persist to localStorage
      // Zustand persist is async, so we need to wait and verify
      let retries = 0;
      let tokenStored = false;
      
      while (retries < 5 && !tokenStored) {
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const stored = localStorage.getItem("indovault-auth");
        const parsed = stored ? JSON.parse(stored) : null;
        tokenStored = !!parsed?.state?.token;
        
        console.log(`[LOGIN] 📦 Token storage check (attempt ${retries + 1}):`, {
          stored: !!stored,
          tokenStored,
          tokenMatches: parsed?.state?.token === accessToken,
        });

        if (!tokenStored && retries < 4) {
          // Retry storing
          console.log("[LOGIN] ⚠️ Token not stored yet, retrying...");
          setToken(accessToken);
          if (refreshToken) {
            useAuth.getState().setRefreshToken(refreshToken);
          }
        }
        
        retries++;
      }

      if (!tokenStored) {
        console.error("[LOGIN] ❌ CRITICAL: Token still not stored after retries!");
        alert("Gagal menyimpan sesi. Silakan coba login lagi.");
        return;
      }

      console.log("[LOGIN] ✅ Token confirmed stored, redirecting to vault domain...");

      // After login, redirect to vault domain with token in URL (temporary)
      // Vault domain will extract token and store in its own localStorage
      const vaultUrl = new URL(getVaultDomainUrl("/dashboard"));
      vaultUrl.searchParams.set("token", accessToken);
      if (refreshToken) {
        vaultUrl.searchParams.set("refreshToken", refreshToken);
      }
      
      console.log("[LOGIN] 🔄 Redirecting to vault with token in URL (will be stored in vault localStorage)");
      window.location.replace(vaultUrl.toString());
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorMessage = error.response?.data?.message || error.message || "Terjadi kesalahan saat login";
      alert("Login gagal: " + errorMessage);
      
      // Reset 2FA state on error
      if (error.response?.status !== 202) {
        setShowTwoFactor(false);
        setTwoFactorToken("");
      }
    } finally {
      setLoading(false);
    }
  }

  // Show loading while checking auth state
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-emerald-dark-gradient flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-dark-gradient flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-[#020617] border border-emerald-500/40 shadow-xl shadow-emerald-500/10">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-neon-emerald-bright text-center">
            🔐 Indo-Vault Login
          </CardTitle>
          <p className="text-sm text-gray-400 mt-2 text-center">Zero-Knowledge Password Manager</p>
          {alreadyLoggedIn && (
            <div className="mt-3 text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
              Kamu sudah login. Buka dashboard di vault domain:
              <div className="mt-2">
                <a
                  href={getVaultDomainUrl("/dashboard")}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                >
                  Buka Vault Dashboard
                </a>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4 mt-2">
          {!showTwoFactor ? (
            <>
              <Input
                placeholder="Email"
                className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400 focus:ring-emerald-400/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />

              <Input
                placeholder="Password"
                type="password"
                className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400 focus:ring-emerald-400/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </>
          ) : (
            <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
              <p className="text-center text-emerald-400 font-medium">Masukkan Kode 2FA</p>
              <Input
                placeholder="000000"
                className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400 focus:ring-emerald-400/20 text-center text-2xl tracking-widest"
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                maxLength={6}
                autoFocus
              />
            </div>
          )}

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : (showTwoFactor ? "Verifikasi" : "Login")}
          </Button>

          <div className="text-sm text-gray-400 text-center">
            Belum punya akun?{" "}
            <a href="/register" className="text-emerald-400 hover:text-emerald-300 hover:underline">
              Register
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
