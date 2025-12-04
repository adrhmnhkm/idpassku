"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyber-bg to-cyber-card z-0" />

            {/* Decorative Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyber-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-r from-cyber-card to-gray-900 border border-cyber-primary/30 rounded-3xl p-8 md:p-16 text-center max-w-4xl mx-auto shadow-2xl"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Mulai Amankan <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-cyber-accent">Password</span> Anda
                    </h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
                        Bergabunglah dengan pengguna lain yang telah mengamankan data mereka. Gratis untuk penggunaan pribadi.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            href="/register"
                            className="group px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                        >
                            Daftar Sekarang
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
