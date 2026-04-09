import Link from "next/link";

export function NavBar() {
  return (
    <nav className="bg-surface/80 backdrop-blur-md border-b border-surface-container sticky top-0 z-50 w-full">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-black text-primary tracking-tight">DokaniAI</div>
        <div className="hidden md:flex gap-8 items-center font-semibold text-base">
          <Link className="text-primary border-b-2 border-primary pb-1" href="#">Features</Link>
          <Link className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-300 px-3 py-1 rounded" href="#">Pricing</Link>
          <Link className="text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-300 px-3 py-1 rounded" href="#">About</Link>
        </div>
        <Link href="/register">
          <button className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold active:scale-95 transition-transform shadow-md">
            Get Started
          </button>
        </Link>
      </div>
    </nav>
  );
}
