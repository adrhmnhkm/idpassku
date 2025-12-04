"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-cyber-card border-t border-gray-800 py-12">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="w-8 h-8 text-cyber-primary" />
                            <span className="text-2xl font-bold text-white">idpassKu</span>
                        </div>
                        <p className="text-gray-400 max-w-sm">
                            Platform keamanan identitas digital terpercaya untuk individu dan bisnis. Amankan masa depan digital Anda hari ini.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4">Produk</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link href="#" className="hover:text-cyber-primary transition-colors">Fitur</Link></li>
                            <li><Link href="#" className="hover:text-cyber-primary transition-colors">Harga</Link></li>
                            <li><Link href="#" className="hover:text-cyber-primary transition-colors">Enterprise</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4">Perusahaan</h4>
                        <ul className="space-y-2 text-gray-400">
                            <li><Link href="#" className="hover:text-cyber-primary transition-colors">Tentang Kami</Link></li>
                            <li><Link href="#" className="hover:text-cyber-primary transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-cyber-primary transition-colors">Kontak</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} idpassKu. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
