"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/store";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { getVaultDomainUrl, isMainDomain } from "@/lib/url-helper";

export default function Home() {
  const token = useAuth((s) => s.token);

  useEffect(() => {
    // If user is authenticated and on main domain, redirect to vault domain
    if (token && typeof window !== "undefined" && isMainDomain()) {
      window.location.href = getVaultDomainUrl("/dashboard");
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
