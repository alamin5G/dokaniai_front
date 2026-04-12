"use client";

import apiClient from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";

interface AdminProfile {
  id: string;
  name: string | null;
  role: string;
  email: string | null;
  phone: string | null;
}

export default function AdminDashboardPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    const loadAdminProfile = async () => {
      if (!accessToken) {
        window.location.replace("/login");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get("/users/me");
        const user = response.data?.data as AdminProfile;
        if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
          window.location.replace("/dashboard");
          return;
        }
        setProfile(user);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load admin profile");
      } finally {
        setLoading(false);
      }
    };

    void loadAdminProfile();
  }, [accessToken]);

  if (loading) {
    return <main className="min-h-screen bg-surface p-8 text-on-surface">Loading admin dashboard...</main>;
  }

  if (error) {
    return <main className="min-h-screen bg-surface p-8 text-error">{error}</main>;
  }

  return (
    <main className="min-h-screen bg-surface p-6 md:p-8">
      <section className="mx-auto max-w-6xl rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-on-surface">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Welcome, {profile?.name || "Admin"} ({profile?.role})
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <p className="text-sm text-on-surface-variant">User Management</p>
            <p className="mt-2 text-lg font-semibold text-on-surface">Ready</p>
          </article>
          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <p className="text-sm text-on-surface-variant">Subscription Ops</p>
            <p className="mt-2 text-lg font-semibold text-on-surface">Ready</p>
          </article>
          <article className="rounded-2xl border border-outline-variant/30 bg-surface p-4">
            <p className="text-sm text-on-surface-variant">Payment Review</p>
            <p className="mt-2 text-lg font-semibold text-on-surface">Ready</p>
          </article>
        </div>
      </section>
    </main>
  );
}
