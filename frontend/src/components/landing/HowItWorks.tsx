"use client";

import { motion } from "framer-motion";
import { UserPlus, Save, ShieldCheck } from "lucide-react";

const steps = [
    {
        icon: <UserPlus className="w-8 h-8 text-black" />,
        title: "1. Daftar Gratis",
        description: "Buat akun idpassKu hanya dalam 30 detik. Tidak perlu kartu kredit.",
        color: "bg-cyber-primary"
    },
    {
        icon: <Save className="w-8 h-8 text-black" />,
        title: "2. Simpan Data",
        description: "Masukkan password dan data penting Anda ke dalam vault terenkripsi.",
        color: "bg-cyber-accent"
    },
    {
        icon: <ShieldCheck className="w-8 h-8 text-black" />,
        title: "3. Jelajah Aman",
        description: "Login otomatis ke situs favorit Anda dengan aman dan cepat.",
        color: "bg-white"
    }
];

export default function HowItWorks() {
    return (
        <section className="py-20 bg-cyber-bg relative">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Cara Kerja <span className="text-cyber-accent">Sederhana</span></h2>
                    <p className="text-gray-400">Amankan data Anda dalam 3 langkah mudah.</p>
                </motion.div>

                <div className="flex flex-col md:flex-row justify-center items-center gap-8 relative">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden md:block absolute top-1/2 left-20 right-20 h-0.5 bg-gradient-to-r from-cyber-primary/20 via-cyber-accent/20 to-cyber-primary/20 -z-10 transform -translate-y-8" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            className="relative flex flex-col items-center text-center max-w-xs"
                        >
                            <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.2)] transform rotate-3 hover:rotate-6 transition-transform`}>
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-gray-400 text-sm">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
