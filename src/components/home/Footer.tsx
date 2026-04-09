import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-container-low w-full mt-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-6 py-12 max-w-7xl mx-auto">
        <div className="col-span-2 md:col-span-1 space-y-4">
          <div className="text-xl font-bold text-primary font-headline">DokaniAI</div>
          <p className="text-sm text-on-surface-variant font-medium">© 2024 DokaniAI. Empowering Bangladesh&apos;s Micro-Shops with Amanat.</p>
        </div>
        
        <div className="space-y-3">
          <h5 className="font-bold text-primary">Plans</h5>
          <ul className="text-sm text-on-surface-variant font-medium space-y-2">
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="#">Trial 1 (65 Days)</Link></li>
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="#">Basic (149 BDT)</Link></li>
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="#">Pro (399 BDT)</Link></li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <h5 className="font-bold text-primary">Resources</h5>
          <ul className="text-sm text-on-surface-variant font-medium space-y-2">
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="#">Privacy Policy</Link></li>
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="#">PWA Guide</Link></li>
            <li><Link className="hover:text-primary hover:translate-x-1 transition-transform inline-block" href="#">Help Center</Link></li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <h5 className="font-bold text-primary">Connect</h5>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors" data-icon="facebook">social_leaderboard</span>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors" data-icon="phone_in_talk">phone_in_talk</span>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors" data-icon="mail">mail</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
