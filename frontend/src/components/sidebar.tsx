"use client";

import Link from "next/link";
import { useAuth } from "@/lib/store";
import { keyManager } from "@/lib/crypto";
import { TwoFactorSetup } from "@/components/two-factor-setup";

export default function Sidebar() {
  const logout = useAuth((s) => s.logout);

  const handleLogout = () => {
    keyManager.clearKey(); // Clear encryption key on logout
    logout();

      // redirect lintas domain agar semua sesi logout benar-benar hilang
    window.location.href = "https://idpassku.com";
  };

  return (
    <aside className="w-64 min-h-screen bg-[#020617] border-r border-emerald-500/30 shadow-xl relative">
      <div className="p-6 border-b border-emerald-500/20">
        <h1 className="text-2xl font-bold text-neon-emerald-bright">IdpassKu</h1>
        <p className="text-xs text-emerald-300/60 mt-1">Zero-Knowledge Password Manager</p>
      </div>

      <nav className="p-4 space-y-2">
        <Link
          href="/dashboard"
          className="block px-4 py-3 rounded-lg text-gray-300 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all duration-200 emerald-glow-sm"
        >
          🏠 Dashboard
        </Link>

        <Link
          href="/dashboard/items"
          className="block px-4 py-3 rounded-lg text-gray-300 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all duration-200 emerald-glow-sm"
        >
          🔐 Vault Items
        </Link>
      </nav>

      <div className="absolute bottom-6 left-4 right-4 space-y-2">
        <TwoFactorSetup />
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 border border-red-500/30 cyber-glow-red"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
