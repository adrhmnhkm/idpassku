"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldCheck, Loader2, ShieldOff } from "lucide-react";

export function TwoFactorSetup() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"initial" | "qr" | "success">("initial");
    const [qrCode, setQrCode] = useState("");
    const [secret, setSecret] = useState("");
    const [token, setToken] = useState("");
    const [disabling, setDisabling] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean | null>(null);

    // Check 2FA status when component mounts or dialog opens
    useEffect(() => {
        if (open) {
            checkTwoFactorStatus();
        }
    }, [open]);

    const checkTwoFactorStatus = async () => {
        try {
            const res = await apiClient.get("/auth/me");
            setTwoFactorEnabled(res.data.twoFactorEnabled || false);
        } catch (error) {
            console.error("Failed to check 2FA status:", error);
            setTwoFactorEnabled(null);
        }
    };

    const startSetup = async () => {
        setLoading(true);
        try {
            const res = await apiClient.post("/auth/2fa/setup");
            setQrCode(res.data.qrCode);
            setSecret(res.data.secret);
            setStep("qr");
        } catch (error) {
            console.error("Failed to start 2FA setup:", error);
            alert("Gagal memulai setup 2FA");
        } finally {
            setLoading(false);
        }
    };

    const verifySetup = async () => {
        setLoading(true);
        try {
            await apiClient.post("/auth/2fa/verify", { token });
            setStep("success");
        } catch (error) {
            console.error("Failed to verify 2FA:", error);
            alert("Kode salah atau kadaluarsa");
        } finally {
            setLoading(false);
        }
    };

    const disableTwoFactor = async () => {
        if (!confirm("Nonaktifkan 2FA untuk akun ini? Login berikutnya tidak akan meminta kode 2FA lagi.")) return;
        setDisabling(true);
        try {
            const res = await apiClient.post("/auth/2fa/disable");
            console.log("Disable 2FA response:", res.data);
            
            // Refresh status immediately
            await checkTwoFactorStatus();
            
            alert("2FA berhasil dinonaktifkan. Login berikutnya tidak akan meminta kode 2FA.");
            setOpen(false);
            setStep("initial");
            setQrCode("");
            setSecret("");
            setToken("");
        } catch (error: any) {
            console.error("Failed to disable 2FA:", error);
            const errorMsg = error.response?.data?.message || error.message || "Gagal menonaktifkan 2FA";
            alert(errorMsg);
        } finally {
            setDisabling(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 w-full">
                    <ShieldCheck className="mr-2 h-4 w-4" /> 2FA Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#020617] border border-emerald-500/40 text-white shadow-2xl shadow-emerald-500/10">
                <DialogHeader>
                    <DialogTitle className="text-emerald-400 text-xl font-bold">Two-Factor Authentication</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {step === "initial" && (
                        <div className="space-y-4">
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                <p className="text-sm text-gray-300 mb-2">
                                    <strong className="text-emerald-400">Status 2FA:</strong>{" "}
                                    {twoFactorEnabled === null ? (
                                        <span className="text-gray-500">Checking...</span>
                                    ) : twoFactorEnabled ? (
                                        <span className="text-yellow-400">🟡 Aktif</span>
                                    ) : (
                                        <span className="text-gray-400">⚪ Nonaktif</span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {twoFactorEnabled
                                        ? "2FA aktif. Setiap login akan meminta kode dari aplikasi authenticator."
                                        : "2FA tidak aktif. Login tidak akan meminta kode 2FA."}
                                </p>
                            </div>

                            {twoFactorEnabled && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                    <p className="text-sm text-red-300 mb-2">
                                        ⚠️ 2FA sedang aktif. Untuk development, kamu bisa nonaktifkan di bawah.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Button
                                    onClick={startSetup}
                                    disabled={loading || twoFactorEnabled === true}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                    {twoFactorEnabled ? "2FA Sudah Aktif" : "Aktifkan 2FA"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={disableTwoFactor}
                                    disabled={disabling || twoFactorEnabled === false}
                                    className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {disabling ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ShieldOff className="mr-2 h-4 w-4" />
                                    )}
                                    {twoFactorEnabled === false ? "2FA Sudah Nonaktif" : "Nonaktifkan 2FA"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "qr" && (
                        <div className="space-y-4 flex flex-col items-center">
                            <p className="text-sm text-gray-400 text-center">
                                Scan QR Code ini dengan aplikasi Google Authenticator atau Authy.
                            </p>

                            <div className="bg-white p-2 rounded-lg">
                                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                            </div>

                            <div className="w-full space-y-2">
                                <p className="text-xs text-gray-500 text-center">Atau masukkan kode manual: <span className="font-mono text-emerald-300">{secret}</span></p>
                                <Input
                                    placeholder="Masukkan kode 6-digit"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="bg-[#022c22] border-emerald-500/40 text-white text-center text-lg tracking-widest"
                                    maxLength={6}
                                />
                                <Button
                                    onClick={verifySetup}
                                    disabled={loading || token.length !== 6}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                                >
                                    {loading ? "Verifying..." : "Verifikasi & Aktifkan"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <ShieldCheck className="h-8 w-8 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">2FA Aktif!</h3>
                            <p className="text-gray-300">Akun Anda sekarang lebih aman.</p>
                            <Button
                                onClick={() => setOpen(false)}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                            >
                                Selesai
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
