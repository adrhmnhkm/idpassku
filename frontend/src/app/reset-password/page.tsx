"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PasswordGenerator } from "@/components/password-generator";

import { Suspense } from "react";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid or missing reset token.");
        }
    }, [token]);

    async function handleSubmit() {
        if (!password || !token) return;

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage("Passwords do not match.");
            return;
        }

        setStatus("loading");
        try {
            await api.post("/auth/reset-password", { token, newPassword: password });
            setStatus("success");
            setMessage("Password has been reset successfully.");
            setTimeout(() => router.push("/login"), 3000);
        } catch (error: any) {
            setStatus("error");
            setMessage(error.response?.data?.message || "Failed to reset password.");
        }
    }

    if (status === "success") {
        return (
            <div className="min-h-screen bg-emerald-dark-gradient flex items-center justify-center px-4">
                <Card className="w-full max-w-md bg-[#020617] border border-emerald-500/40 shadow-xl p-8 text-center">
                    <h1 className="text-2xl font-bold text-emerald-400 mb-4">Password Reset Complete!</h1>
                    <p className="text-gray-300 mb-6">
                        Your password has been updated. Redirecting to login...
                    </p>
                    <Button className="bg-emerald-600 hover:bg-emerald-500 w-full" onClick={() => router.push("/login")}>
                        Go to Login Now
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-emerald-dark-gradient flex items-center justify-center px-4">
            <Card className="w-full max-w-md bg-[#020617] border border-emerald-500/40 shadow-xl shadow-emerald-500/10 p-6">
                <h1 className="text-3xl font-bold text-neon-emerald-bright text-center mb-2">
                    Reset Password
                </h1>
                <p className="text-gray-400 text-center mb-8 text-sm">
                    Create a new strong password for your account.
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">New Password</label>
                        <div className="flex gap-2">
                            <Input
                                className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400"
                                placeholder="New Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <PasswordGenerator onSelect={setPassword} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Confirm Password</label>
                        <Input
                            className="bg-[#022c22] border-emerald-500/40 text-white focus:border-emerald-400"
                            placeholder="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    {status === "error" && (
                        <p className="text-red-400 text-sm text-center">{message}</p>
                    )}

                    <Button
                        className="bg-emerald-600 hover:bg-emerald-500 w-full font-bold shadow-lg shadow-emerald-500/20"
                        onClick={handleSubmit}
                        disabled={status === "loading" || !token}
                    >
                        {status === "loading" ? "Resetting..." : "Reset Password"}
                    </Button>
                </div>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
