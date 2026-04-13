"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function Spinner() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-surface">
            <div className="w-10 h-10 rounded-full border-4 border-surface-container-high border-t-primary animate-spin" />
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { userRole, accessToken } = useAuthStore();
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        // Wait for hydration
        const timer = setTimeout(() => {
            if (!accessToken || (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")) {
                router.replace("/dashboard");
            } else {
                setChecked(true);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [accessToken, userRole, router]);

    if (!checked) return <Spinner />;

    return (
        <div className="min-h-screen bg-surface">
            {/* Admin top bar */}
            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-lowest px-6 py-3">
                <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">DokaniAI</span>
                    <span className="rounded-full bg-tertiary-container/20 px-2.5 py-0.5 text-xs font-bold text-tertiary">
                        {userRole === "SUPER_ADMIN" ? "SUPER ADMIN" : "ADMIN"}
                    </span>
                </div>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                    ← Back to Dashboard
                </button>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
