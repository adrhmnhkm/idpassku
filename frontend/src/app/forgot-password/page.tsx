"use client";

import { useState } from "react";
import { api } from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit() {
        if (!email) return;

        setStatus("loading");
        try {
            const res = await api.post("/auth/forgot-password", { email });
            setStatus("success");
            setMessage(res.data.message);
        } catch (error: any) {
            setStatus("error");
            setMessage(error.response?.data?.message || "Something went wrong.");
        }
    }

    return (
        <div className="min-h-screen bg-emerald-dark-gradient flex items-center justify-center px-4">
            <Card className="w-full max-w-md bg-[#020617] border border-emerald-500/40 shadow-xl shadow-emerald-500/10 p-6">
                <Link href="/login" className="flex items-center text-gray-400 hover:text-emerald-400 mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                </Link>

                <h1 className="text-3xl font-bold text-neon-emerald-bright text-center mb-2">
                    Forgot Password?
                </h1>
                <p className="text-gray-400 text-center mb-8 text-sm">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {status === "success" ? (
                    <div className="text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <Mail className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                        <h3 className="text-emerald-400 font-semibold mb-2">Check your email</h3>
                        <p className="text-gray-300 text-sm">{message}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Email Address</label>
                            <Input
                                className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400"
                                placeholder="name@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {status === "error" && (
                            <p className="text-red-400 text-sm text-center">{message}</p>
                        )}

                        <Button
                            className="bg-emerald-600 hover:bg-emerald-500 w-full font-bold shadow-lg shadow-emerald-500/20"
                            onClick={handleSubmit}
                            disabled={status === "loading"}
                        >
                            {status === "loading" ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
