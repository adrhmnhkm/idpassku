"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/store";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  const token = useAuth((s) => s.token);

  useEffect(() => {
    // If user is authenticated and on main domain, redirect to vault domain
    if (token && typeof window !== "undefined") {
      const isMainDomain = window.location.hostname === "idpassku.com" || 
        (window.location.hostname !== "vault.idpassku.com" && !window.location.hostname.includes("vault."));
      
      if (isMainDomain) {
        window.location.href = "https://vault.idpassku.com/dashboard";
      }
    }
  }, [token]);

  return (
    <main className="min-h-screen bg-cyber-bg text-white overflow-x-hidden">
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  );
}
