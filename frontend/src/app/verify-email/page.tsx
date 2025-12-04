"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

import { Suspense } from "react";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        api.post("/auth/verify-email", { token })
            .then(() => {
                setStatus("success");
                setMessage("Email verified successfully! You can now login.");
            })
            .catch((err) => {
                setStatus("error");
                setMessage(err.response?.data?.message || "Verification failed.");
            });
    }, [token]);

    return (
        <div className="min-h-screen bg-emerald-dark-gradient flex items-center justify-center px-4">
            <Card className="w-full max-w-md bg-[#020617] border border-emerald-500/40 shadow-xl p-8 text-center">
                <div className="flex justify-center mb-4">
                    {status === "loading" && <Loader2 className="h-12 w-12 text-emerald-400 animate-spin" />}
                    {status === "success" && <CheckCircle className="h-12 w-12 text-emerald-500" />}
                    {status === "error" && <XCircle className="h-12 w-12 text-red-500" />}
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">
                    {status === "loading" ? "Verifying..." : (status === "success" ? "Verified!" : "Verification Failed")}
                </h1>

                <p className="text-gray-400 mb-6">{message}</p>

                {status !== "loading" && (
                    <Button className="bg-emerald-600 hover:bg-emerald-500 w-full" onClick={() => router.push("/login")}>
                        Go to Login
                    </Button>
                )}
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
