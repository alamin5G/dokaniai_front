export function PricingSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <span className="text-secondary font-bold tracking-widest uppercase text-xs">Pricing Plans</span>
          <h2 className="text-4xl font-black text-primary font-headline">আপনার ব্যবসার জন্য সঠিক প্ল্যান</h2>
          <p className="text-on-surface-variant text-lg font-medium">সাশ্রয়ী মূল্যে পান প্রিমিয়াম সব ফিচার</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Trial 1 */}
          <div className="bg-surface-container-low p-6 rounded-[1.5rem] flex flex-col justify-between hover:scale-[1.02] transition-transform shadow-sm">
            <div>
              <h4 className="font-bold text-primary mb-1">Free Trial 1</h4>
              <div className="text-2xl font-black mb-4">৳০ <span className="text-sm font-normal text-on-surface-variant">/৬৫ দিন</span></div>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="check_circle">check_circle</span> মৌলিক সব ফিচার
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="check_circle">check_circle</span> ১টি ডিভাইস কানেক্ট
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full py-3 bg-surface-container-highest hover:bg-surface-dim transition-colors rounded-xl font-bold text-sm">শুরু করুন</button>
          </div>
          
          {/* Trial 2 */}
          <div className="bg-surface-container-low p-6 rounded-[1.5rem] flex flex-col justify-between hover:scale-[1.02] transition-transform shadow-sm">
            <div>
              <h4 className="font-bold text-primary mb-1">Free Trial 2</h4>
              <div className="text-2xl font-black mb-4">৳০ <span className="text-sm font-normal text-on-surface-variant">/৩৫ দিন</span></div>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="check_circle">check_circle</span> সুপার ফাস্ট সাপোর্ট
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="check_circle">check_circle</span> ডাটা ব্যাকআপ
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full py-3 bg-surface-container-highest hover:bg-surface-dim transition-colors rounded-xl font-bold text-sm">শুরু করুন</button>
          </div>
          
          {/* Basic */}
          <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] flex flex-col justify-between border-2 border-primary/20 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-transform">
            <div className="absolute top-0 right-0 bg-primary text-on-primary px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl shadow-sm">Popular</div>
            <div>
              <h4 className="font-bold text-primary mb-1">Basic</h4>
              <div className="text-2xl font-black mb-4">৳১৪৯ <span className="text-sm font-normal text-on-surface-variant">/মাস</span></div>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="check_circle">check_circle</span> আনলিমিটেড এন্ট্রি
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base" data-icon="check_circle">check_circle</span> SMS অ্যালার্ট
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all">সিলেক্ট করুন</button>
          </div>
          
          {/* Pro */}
          <div className="bg-primary-container p-6 rounded-[1.5rem] flex flex-col justify-between text-on-primary-container shadow-sm hover:scale-[1.02] transition-transform">
            <div>
              <h4 className="font-bold mb-1">Pro</h4>
              <div className="text-2xl font-black mb-4">৳৩৯৯ <span className="text-sm font-normal opacity-70">/মাস</span></div>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" data-icon="check_circle">check_circle</span> AI বিজনেস এনালিটিক্স
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" data-icon="check_circle">check_circle</span> ৫ জন ইউজার
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full py-3 bg-white text-primary rounded-xl font-bold text-sm shadow-sm hover:bg-surface active:scale-95 transition-all">প্রো হন</button>
          </div>
          
          {/* Plus */}
          <div className="bg-secondary p-6 rounded-[1.5rem] flex flex-col justify-between text-on-secondary shadow-xl hover:scale-[1.02] transition-transform">
            <div>
              <h4 className="font-bold mb-1 text-secondary-fixed opacity-90">Plus</h4>
              <div className="text-2xl font-black mb-4">৳৭৯৯ <span className="text-sm font-normal opacity-70">/মাস</span></div>
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" data-icon="check_circle">check_circle</span> ইনভেন্টরি অটোমেশন
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" data-icon="check_circle">check_circle</span> ২৪/৭ ভিআইপি সাপোর্ট
                </li>
              </ul>
            </div>
            <button className="mt-8 w-full py-3 bg-secondary-fixed text-on-secondary-fixed rounded-xl font-bold text-sm shadow-md hover:bg-secondary-fixed-dim transition-colors active:scale-95">প্লাস সাবস্ক্রাইব</button>
          </div>
        </div>
      </div>
    </section>
  );
}
