import Link from "next/link";

export function HeroSection() {
  return (
    <header className="relative overflow-hidden pt-16 pb-24 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-fixed text-on-primary-fixed rounded-full font-medium text-sm">
            <span className="material-symbols-outlined text-sm" data-icon="auto_awesome">auto_awesome</span>
            বাংলাদেশের ক্ষুদ্র ব্যবসার ডিজিটাল সাথী
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-primary leading-[1.15] tracking-tight font-headline">
            কাগজের খাতার দিন শেষ, <span className="text-secondary">AI দিয়ে ব্যবসা</span> বড় করুন
          </h1>
          
          <p className="text-xl text-on-surface-variant max-w-lg leading-relaxed font-medium">
            আপনার দোকানের হিসাব রাখা এখন পানির মত সহজ। কোনো টাইপিং ছাড়াই শুধু মুখে কথা বলে আপনার সারাদিনের কেনাবেচা রেকর্ড করুন।
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/register">
              <button className="px-8 py-4 bg-primary text-on-primary rounded-xl font-bold text-lg flex items-center gap-3 hover:shadow-xl transition-all h-full">
                <span className="material-symbols-outlined" data-icon="rocket_launch">rocket_launch</span>
                আজই শুরু করুন
              </button>
            </Link>
            <button className="px-8 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold text-lg flex items-center gap-3 hover:bg-surface-dim transition-all">
              <span className="material-symbols-outlined" data-icon="play_circle">play_circle</span>
              কিভাবে কাজ করে?
            </button>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-4 bg-primary-container/20 rounded-[2.5rem] blur-3xl group-hover:bg-primary-container/30 transition-colors"></div>
          
          <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl bg-surface-container-low">
            <img 
              alt="Smiling Bangladeshi shopkeeper in a modern organized grocery store" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCp-BK_GEuHvnhBqO1cTU_N9Y9UUjd04LcI5mptEF0CVL4e7SSL1qolKM7_W8st8NZM75XWs6M2POYLfr3kaLVo_eN-P4Rt37p5TqdrJurXVijBW3YgtXgeVSCLI0Mi5R1wmlbMctU9nJzuxzOcbohVCETrfghiqMaaL8BoMzQH6BX8m3Jgu4H_9H8DJGAm2ffyl4VZTMkJutUd_dZ_IlMz1kEF3vjP7LUGxmnYG5VSL371rHNpxDdn2vFPW-aeaascIGshLEXs1FQ"
            />
            
            {/* Glass AI Overlay */}
            <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl border border-white/20 shadow-2xl" 
                 style={{ 
                   background: "linear-gradient(135deg, rgba(0, 80, 58, 0.9) 0%, rgba(0, 106, 78, 0.8) 100%)", 
                   backdropFilter: "blur(20px)" 
                 }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-white" data-icon="mic" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">Listening to AI...</p>
                  <p className="text-white font-bold">&quot;আজকে চাল বিক্রি হয়েছে ৫০ কেজি&quot;</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </header>
  );
}
