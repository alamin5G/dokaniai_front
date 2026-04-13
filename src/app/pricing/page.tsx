"use client";

import { Footer } from "@/components/home/Footer";
import { NavBar } from "@/components/home/NavBar";
import { PricingSection } from "@/components/home/PricingSection";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary-fixed overflow-x-hidden">
      <NavBar />

      <main>
        <PricingSection />
      </main>

      <Footer />
    </div>
  );
}
