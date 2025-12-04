"use client";

import { motion } from "framer-motion";
import { Shield, Globe, KeyRound, EyeOff } from "lucide-react";

const features = [
    {
        icon: <Shield className="w-10 h-10 text-cyber-primary" />,
        title: "Enkripsi End-to-End",
        description: "Data Anda dienkripsi di perangkat Anda sebelum dikirim. Hanya Anda yang memiliki kuncinya."
    },
    {
        icon: <Globe className="w-10 h-10 text-cyber-accent" />,
        title: "Akses Dimana Saja",
        description: "Sinkronisasi otomatis antar perangkat. Akses password Anda di HP, Laptop, atau Tablet dengan mudah."
    },
    {
        icon: <KeyRound className="w-10 h-10 text-cyber-primary" />,
        title: "Generator Password Kuat",
        description: "Buat password unik dan kompleks untuk setiap akun hanya dengan satu klik. Anti-hack."
    },
    {
        icon: <EyeOff className="w-10 h-10 text-cyber-accent" />,
        title: "Zero-Knowledge",
        description: "Kami tidak tahu password Anda. Arsitektur kami menjamin privasi total data Anda."
    }
];

export default function Features() {
    return (
        <section id="features" className="py-20 bg-cyber-card relative overflow-hidden">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Fitur <span className="text-cyber-primary">Utama</span></h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Fitur esensial untuk pengelolaan keamanan data Anda.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-cyber-bg p-6 rounded-xl border border-gray-800 hover:border-cyber-primary/50 transition-all hover:shadow-[0_0_15px_rgba(30,144,255,0.2)] group"
                        >
                            <div className="mb-4 p-3 bg-cyber-card rounded-lg w-fit group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
