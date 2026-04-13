"use client";

import apiClient from "@/lib/api";
import { decideCategoryRequest, getPendingCategoryRequests } from "@/lib/categoryApi";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import type { CategoryRequestResponse } from "@/types/categoryRequest";

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
  const [pendingRequests, setPendingRequests] = useState<CategoryRequestResponse[]>([]);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  const loadPendingRequests = async () => {
    try {
      const rows = await getPendingCategoryRequests(0, 20);
      setPendingRequests(rows);
    } catch {
      // Keep dashboard usable even if moderation API fails.
      setPendingRequests([]);
    }
  };

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
        await loadPendingRequests();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load admin profile");
      } finally {
        setLoading(false);
      }
    };

    void loadAdminProfile();
  }, [accessToken]);

  const handleDecision = async (
    requestId: string,
    action: "APPROVE_GLOBAL" | "APPROVE_BUSINESS" | "MERGE" | "REJECT",
  ) => {
    let suggestedCategoryId: string | undefined;
    let rejectionReason: string | undefined;

    if (action === "MERGE") {
      const input = window.prompt("Merge target category ID দিন:");
      if (!input) return;
      suggestedCategoryId = input;
    }

    if (action === "REJECT") {
      const input = window.prompt("Reject reason দিন:");
      if (!input) return;
      rejectionReason = input;
    }

    setModeratingId(requestId);
    try {
      await decideCategoryRequest(requestId, {
        action,
        approvedScope: action === "APPROVE_BUSINESS" ? "BUSINESS" : action === "APPROVE_GLOBAL" ? "GLOBAL" : undefined,
        suggestedCategoryId,
        rejectionReason,
      });
      await loadPendingRequests();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decision update failed");
    } finally {
      setModeratingId(null);
    }
  };

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

        <section className="mt-8 rounded-2xl border border-outline-variant/30 bg-surface p-4">
          <h2 className="text-lg font-semibold text-on-surface">Category Request Moderation</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Pending: {pendingRequests.length}</p>

          <div className="mt-4 space-y-3">
            {pendingRequests.map((item) => (
              <article key={item.id} className="rounded-xl border border-outline-variant/30 p-3">
                <p className="text-sm font-semibold text-on-surface">{item.nameBn} {item.nameEn ? `/ ${item.nameEn}` : ""}</p>
                <p className="text-xs text-on-surface-variant">
                  {item.businessName || "Business"} • {item.businessType || "OTHER"} • Scope: {item.requestedScope || "AUTO"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-lg border px-3 py-1 text-xs" disabled={moderatingId === item.id} onClick={() => handleDecision(item.id, "APPROVE_GLOBAL")}>Approve GLOBAL</button>
                  <button className="rounded-lg border px-3 py-1 text-xs" disabled={moderatingId === item.id} onClick={() => handleDecision(item.id, "APPROVE_BUSINESS")}>Approve BUSINESS</button>
                  <button className="rounded-lg border px-3 py-1 text-xs" disabled={moderatingId === item.id} onClick={() => handleDecision(item.id, "MERGE")}>Merge</button>
                  <button className="rounded-lg border border-error px-3 py-1 text-xs text-error" disabled={moderatingId === item.id} onClick={() => handleDecision(item.id, "REJECT")}>Reject</button>
                </div>
              </article>
            ))}
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No pending category requests.</p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
