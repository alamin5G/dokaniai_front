"use client";

import { Footer } from "@/components/home/Footer";
import { GrowthStorySection } from "@/components/home/GrowthStorySection";
import { NavBar } from "@/components/home/NavBar";
import { PricingSection } from "@/components/home/PricingSection";
import { TrustSection } from "@/components/home/TrustSection";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary-fixed overflow-x-hidden">
      <NavBar />

      <main>
        <PricingSection />
        <GrowthStorySection />
        <TrustSection />
      </main>

      {/* AI FAB Button */}
      <div className="fixed bottom-12 right-12 z-50">
        <button className="w-16 h-16 md:w-20 md:h-20 rounded-xl primary-gradient flex items-center justify-center text-white shadow-2xl hover:scale-105 transition-transform">
          <span
            className="material-symbols-outlined text-3xl md:text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </button>
      </div>

      <Footer />
    </div>
  );
}
