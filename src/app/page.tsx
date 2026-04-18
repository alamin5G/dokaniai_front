"use client";

import { DemoSection } from "@/components/home/DemoSection";
import { FAQSection } from "@/components/home/FAQSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { FinalCTASection } from "@/components/home/FinalCTASection";
import { Footer } from "@/components/home/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { NavBar } from "@/components/home/NavBar";
import { PricingSection } from "@/components/home/PricingSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { TrustIndicators } from "@/components/home/TrustIndicators";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary-fixed overflow-x-hidden">
      <NavBar />

      <main>
        <HeroSection />
        <TrustIndicators />
        <DemoSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>

      <Footer />
    </div>
  );
}
