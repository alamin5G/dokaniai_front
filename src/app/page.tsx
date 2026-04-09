import { NavBar } from "@/components/home/NavBar";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { PricingSection } from "@/components/home/PricingSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { Footer } from "@/components/home/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body selection:bg-primary-fixed overflow-x-hidden">
      <NavBar />
      
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
      </main>
      
      {/* Floating Action Button (FAB) - Speak to AI */}
      <button className="fixed bottom-8 right-8 w-20 h-20 bg-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] border-4 border-white/20 group">
        <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-colors"></div>
        <span className="material-symbols-outlined text-white text-4xl relative z-10" data-icon="mic" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
      </button>

      <Footer />
    </div>
  );
}
