"use client";

import { useState } from "react";
import { api } from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    try {
      await api.post("/auth/register", { email, name, password });
      setSuccess(true);
    } catch (error: any) {
      alert("Pendaftaran gagal: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-emerald-dark-gradient flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-[#020617] border border-emerald-500/40 shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-emerald-400 mb-4">Registration Successful!</h1>
          <p className="text-gray-300 mb-6">
            We have sent a verification email to <strong>{email}</strong>.
            <br />
            Please check your inbox (or spam folder) and click the link to activate your account.
          </p>
          <Button className="bg-emerald-600 hover:bg-emerald-500 w-full" onClick={() => window.location.href = "/login"}>
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-dark-gradient flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-[#020617] border border-emerald-500/40 shadow-xl shadow-emerald-500/10 p-6">
        <h1 className="text-3xl font-bold text-neon-emerald-bright text-center mb-2">
          Register IdpassKu
        </h1>
        <p className="text-gray-400 text-center mb-6 text-sm">Create your secure vault today</p>

        <div className="space-y-4">
          <Input
            className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            className="bg-emerald-600 hover:bg-emerald-500 w-full font-bold shadow-lg shadow-emerald-500/20"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </Button>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          Already have an account? <a href="/login" className="text-emerald-400 hover:underline">Login</a>
        </div>
      </Card>
    </div>
  );
}
