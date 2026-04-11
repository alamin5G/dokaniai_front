"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, clearTokens } = useAuthStore();

  const handleLogout = () => {
    clearTokens();
    router.push("/login");
  };

  if (!accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Bar */}
      <header className="bg-surface-container border-b border-outline-variant sticky top-0 z-50">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-xl">book_2</span>
            </div>
            <h1 className="text-xl font-bold text-primary">DokaniAI</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => router.push("/sessions")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-xl">shield</span>
              <span className="font-medium text-sm hidden sm:inline">Sessions</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span className="font-medium text-sm hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-2">স্বাগতম! 🎉</h2>
          <p className="text-on-surface-variant text-lg">আপনার ড্যাশবোর্ড প্রস্তুত। নিচের অ্যাকশনগুলো থেকে শুরু করুন।</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {[
            { icon: "add_circle", label: "নতুন বিক্রি", color: "bg-primary-container text-on-primary-container" },
            { icon: "inventory_2", label: "পণ্য যোগ করুন", color: "bg-secondary-container text-on-secondary-container" },
            { icon: "receipt_long", label: "বাকির হিসাব", color: "bg-tertiary-fixed text-on-tertiary-fixed" },
            { icon: "payments", label: "খরচ লিখুন", color: "bg-error-container text-on-error-container" },
            { icon: "monitoring", label: "রিপোর্ট", color: "bg-surface-container-high text-on-surface" },
            { icon: "mic", label: "AI সহকারী", color: "bg-primary-fixed text-on-primary-fixed" },
            { icon: "store", label: "ব্যবসা সেটিংস", color: "bg-surface-container text-on-surface" },
            { icon: "settings", label: "সেটিংস", color: "bg-surface-container-highest text-on-surface" },
          ].map((action) => (
            <button
              key={action.icon}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm border border-outline-variant/10"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.color}`}>
                <span className="material-symbols-outlined text-2xl">{action.icon}</span>
              </div>
              <span className="font-semibold text-sm text-on-surface">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl">trending_up</span>
              <h3 className="font-bold text-on-surface">আজকের বিক্রি</h3>
            </div>
            <p className="text-3xl font-black text-primary">৳০</p>
            <p className="text-sm text-on-surface-variant mt-1">কোনো বিক্রি হয়নি</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">account_balance_wallet</span>
              <h3 className="font-bold text-on-surface">বাকির পরিমাণ</h3>
            </div>
            <p className="text-3xl font-black text-secondary">৳০</p>
            <p className="text-sm text-on-surface-variant mt-1">কোনো বাকি নেই</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-tertiary text-2xl">inventory</span>
              <h3 className="font-bold text-on-surface">স্টকে পণ্য</h3>
            </div>
            <p className="text-3xl font-black text-tertiary">০</p>
            <p className="text-sm text-on-surface-variant mt-1">পণ্য যোগ করুন</p>
          </div>
        </div>

        {/* Placeholder */}
        <div className="text-center py-12 bg-surface-container-low rounded-2xl">
          <span className="material-symbols-outlined text-primary text-6xl mb-4 block">construction</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">ড্যাশবোর্ড তৈরি হচ্ছে</h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            এই পৃষ্ঠাটি শীঘ্রই সম্পূর্ণ কার্যকর ড্যাশবোর্ড হিসেবে আসছে। 
            বিক্রি, বাকি, রিপোর্ট সব এখান থেকে পরিচালনা করতে পারবেন।
          </p>
        </div>
      </main>
    </div>
  );
}
