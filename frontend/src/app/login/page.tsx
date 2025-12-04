"use client";

import { useState } from "react";
import { api } from "@/lib/axios";
import { useAuth } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { keyManager } from "@/lib/crypto";

export default function LoginPage() {
  const setToken = useAuth((s) => s.setToken);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const { accessToken, user } = res.data;
      setToken(accessToken); // Use setToken from store

      // Derive encryption key
      await keyManager.deriveKey(password);

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login failed:", error);
      alert("Login gagal: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
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
