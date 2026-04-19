"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function Spinner() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="w-10 h-10 rounded-full border-4 border-surface-container-high border-t-primary animate-spin" />
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { userRole, accessToken } = useAuthStore();
    const router = useRouter();
    const [checked, setChecked] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
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
        <div className="flex h-screen bg-background overflow-hidden">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-surface-container-lowest border-r border-outline-variant/15 flex flex-col justify-between p-4 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
                <div className="flex flex-col gap-4">
                    <div className="flex gap-3 mb-8 items-center">
                        <div className="bg-surface-container-low aspect-square rounded-full size-10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-on-surface font-headline text-base font-bold leading-tight">DokaniAI Admin</h1>
                            <p className="text-on-surface-variant text-sm font-medium">{userRole === "SUPER_ADMIN" ? "Superadmin" : "Admin"}</p>
                        </div>
                    </div>
                    <nav className="flex flex-col gap-1">
                        <SidebarLink href="/admin" icon="dashboard" label="Dashboard" filled />
                        <SidebarLink href="/admin/users" icon="group" label="Users" />
                        <SidebarLink href="/admin/payments" icon="payments" label="Payments" />
                        <SidebarLink href="/admin/coupons" icon="confirmation_number" label="Coupons" />
                        <SidebarLink href="/admin/categories" icon="category" label="Categories" />
                        <SidebarLink href="/admin/referrals" icon="share" label="Referrals" />
                        <SidebarLink href="/admin/support" icon="support_agent" label="Support" />
                        {(userRole === "SUPER_ADMIN") && (
                            <SidebarLink href="/admin/audit" icon="receipt_long" label="Audit Logs" />
                        )}
                    </nav>
                </div>
                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors w-full"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-sm font-medium">Back to App</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="flex items-center justify-between px-6 md:px-8 py-4 bg-background/80 backdrop-blur-xl z-10 shrink-0">
                    <div className="flex items-center gap-4 text-on-surface md:hidden">
                        <button onClick={() => setSidebarOpen(true)}>
                            <span className="material-symbols-outlined text-2xl">menu</span>
                        </button>
                        <h2 className="font-headline text-xl font-bold">DokaniAI</h2>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-on-surface" />
                    <div className="flex flex-1 justify-end gap-4 md:gap-6 items-center">
                        <div className="relative w-full max-w-sm hidden md:block">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-on-surface-variant">search</span>
                            </div>
                            <input
                                className="block w-full pl-11 pr-4 py-2.5 bg-surface-container-low border-0 rounded-full text-on-surface placeholder-on-surface-variant text-sm focus:ring-0 focus:bg-surface-container-high transition-colors"
                                placeholder="Search shops, users, transactions..."
                                type="text"
                            />
                        </div>
                        <button className="size-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors relative">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 size-2 bg-error rounded-full" />
                        </button>
                        <div className="size-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary font-bold text-sm">
                            {(userRole === "SUPER_ADMIN" ? "SA" : "A")}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

function SidebarLink({ href, icon, label, filled }: { href: string; icon: string; label: string; filled?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));

    return (
        <button
            onClick={() => router.push(href)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${
                isActive
                    ? "bg-surface-container text-on-surface"
                    : "text-on-surface-variant hover:bg-surface-container-low"
            }`}
        >
            <span
                className={`material-symbols-outlined ${isActive ? "text-primary" : ""}`}
                style={isActive || filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
                {icon}
            </span>
            <span className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
        </button>
    );
}
