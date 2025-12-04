"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, Lock, Key } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cyber-bg pt-20">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="container mx-auto px-4 z-10 grid lg:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                        Kelola <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-cyber-accent">Password</span> dengan Aman
                    </h1>
                    <p className="text-xl text-gray-400 mb-8 max-w-lg">
                        Simpan dan akses password Anda dengan mudah. Enkripsi standar industri menjaga data Anda tetap pribadi, hanya untuk Anda.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/register"
                            className="px-8 py-4 bg-gradient-to-r from-cyber-primary to-cyber-accent text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(30,144,255,0.5)] transition-all transform hover:-translate-y-1 text-center"
                        >
                            Mulai Gratis
                        </Link>
                        <Link
                            href="#features"
                            className="px-8 py-4 border border-cyber-primary/30 text-cyber-primary font-bold rounded-lg hover:bg-cyber-primary/10 transition-all text-center"
                        >
                            Pelajari Lebih Lanjut
                        </Link>
                    </div>
                </motion.div>

                {/* Visual Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative"
                >
                    <div className="relative w-full aspect-square max-w-md mx-auto">
                        {/* Abstract Shield/Lock Composition */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyber-card to-black rounded-2xl border border-cyber-primary/30 shadow-2xl flex items-center justify-center">
                            <div className="relative">
                                <ShieldCheck className="w-48 h-48 text-cyber-primary opacity-80" />
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-4 border-dashed border-cyber-accent/30 rounded-full w-64 h-64 -m-8"
                                />
                            </div>
                        </div>

                        {/* Floating Cards */}
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-10 -right-10 bg-cyber-card p-4 rounded-xl border border-cyber-accent/30 shadow-lg flex items-center gap-3"
                        >
                            <div className="p-2 bg-cyber-accent/20 rounded-lg">
                                <Lock className="w-6 h-6 text-cyber-accent" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Status Keamanan</div>
                                <div className="text-sm font-bold text-cyber-accent">Terproteksi</div>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 20, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute -bottom-10 -left-10 bg-cyber-card p-4 rounded-xl border border-cyber-primary/30 shadow-lg flex items-center gap-3"
                        >
                            <div className="p-2 bg-cyber-primary/20 rounded-lg">
                                <Key className="w-6 h-6 text-cyber-primary" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Total Password</div>
                                <div className="text-sm font-bold text-white">1,240+ Tersimpan</div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
