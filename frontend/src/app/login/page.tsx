"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { useAuth } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { keyManager } from "@/lib/crypto";

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

  // Hydrate check to avoid SSR mismatch
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (hydrated && token) {
      // Check if we're on the correct domain
      const isVaultDomain = typeof window !== "undefined" && 
        (window.location.hostname === "vault.idpassku.com" || window.location.hostname.includes("vault."));
      
      if (isVaultDomain) {
        router.replace("/dashboard");
      } else {
        // Redirect to vault domain
        window.location.href = "https://vault.idpassku.com/dashboard";
      }
    }
  }, [hydrated, token, router]);

  async function handleLogin() {
    setLoading(true);
    try {
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
      setToken(accessToken); // Use setToken from store
      
      // Store refresh token if provided
      const setRefreshToken = useAuth.getState().setRefreshToken;
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }

      // Derive encryption key
      await keyManager.deriveKey(password);

      // Always redirect to vault domain after login
      const vaultUrl = typeof window !== "undefined" && window.location.hostname.includes("vault.")
        ? "/dashboard" // Already on vault domain, use relative path
        : "https://vault.idpassku.com/dashboard"; // On main domain, redirect to vault domain
      
      if (vaultUrl.startsWith("http")) {
        window.location.href = vaultUrl;
      } else {
        router.push(vaultUrl);
      }
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
  if (!hydrated || (hydrated && token)) {
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
