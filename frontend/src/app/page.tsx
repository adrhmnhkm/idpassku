"use client";

import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  // Landing page selalu ditampilkan di domain utama
  // Tidak ada redirect - user bisa akses landing page kapan saja
  // Jika user sudah login dan ingin ke dashboard, mereka bisa klik link login/dashboard
  
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
