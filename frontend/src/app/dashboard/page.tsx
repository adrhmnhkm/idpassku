"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Key, Plus, History, Lock } from "lucide-react";
import Link from "next/link";
import AddItemModal from "@/components/AddItemModal";
import { PasswordGenerator } from "@/components/password-generator";

export default function DashboardHome() {
  const token = useAuth((s) => s.token);
  const [stats, setStats] = useState({
    totalItems: 0,
    securityScore: 0,
    recentItems: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await apiClient.get("/vault/items");
        const items = res.data.items || [];

        // Calculate basic stats
        const totalItems = items.length;
        // Mock security score for now (can be improved later)
        const securityScore = totalItems > 0 ? Math.min(100, totalItems * 10 + 50) : 0;
        const recentItems = items.slice(0, 3);

        setStats({
          totalItems,
          securityScore,
          recentItems,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchStats();
    }
  }, [token]);

  if (loading) {
    return <div className="text-emerald-300">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon-emerald-bright">Dashboard</h1>
          <p className="text-gray-400 mt-1">Your passwords. Safely caged.</p>
        </div>
        <div className="flex gap-2">
          <AddItemModal />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#020617] border-emerald-500/30 shadow-lg shadow-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Passwords</CardTitle>
            <Key className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalItems}</div>
            <p className="text-xs text-gray-500 mt-1">Stored securely</p>
          </CardContent>
        </Card>

        <Card className="bg-[#020617] border-emerald-500/30 shadow-lg shadow-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Security Score</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{stats.securityScore}%</div>
            <p className="text-xs text-gray-500 mt-1">Vault health status</p>
          </CardContent>
        </Card>

        <Card className="bg-[#020617] border-emerald-500/30 shadow-lg shadow-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Quick Actions</CardTitle>
            <Lock className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="flex gap-2">
            <PasswordGenerator onSelect={() => { }} />
            <Link href="/dashboard/items">
              <Button variant="outline" size="sm" className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
                View All
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <History className="h-5 w-5 text-emerald-400" />
          Recent Items
        </h2>

        {stats.recentItems.length === 0 ? (
          <div className="text-gray-500 italic">No recent items found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentItems.map((item) => (
              <div key={item.id} className="bg-[#020617] border border-emerald-500/20 rounded-lg p-4 hover:border-emerald-500/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-emerald-100">{item.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-gray-400 truncate">
                  {item.username}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
