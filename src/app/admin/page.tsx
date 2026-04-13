"use client";

import apiClient from "@/lib/api";
import {
  decideCategoryRequest,
  getCategoriesByBusinessType,
  getPendingCategoryRequests,
} from "@/lib/categoryApi";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useMemo, useState } from "react";
import type { CategoryResponse } from "@/types/category";
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
  const [mergeForRequestId, setMergeForRequestId] = useState<string | null>(null);
  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeSelectedCategoryId, setMergeSelectedCategoryId] = useState("");
  const [categoriesByType, setCategoriesByType] = useState<Record<string, CategoryResponse[]>>({});
  const [isMergeCategoryLoading, setIsMergeCategoryLoading] = useState(false);

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
    mergeCategoryId?: string,
  ) => {
    const suggestedCategoryId: string | undefined = mergeCategoryId;
    let rejectionReason: string | undefined;

    if (action === "MERGE" && !suggestedCategoryId) {
      return;
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

  const openMergePicker = async (item: CategoryRequestResponse) => {
    const businessType = (item.businessType || "OTHER").toUpperCase();
    setMergeForRequestId(item.id);
    setMergeSearch("");
    setMergeSelectedCategoryId("");

    if (categoriesByType[businessType]) {
      return;
    }

    setIsMergeCategoryLoading(true);
    try {
      const rows = await getCategoriesByBusinessType(businessType);
      setCategoriesByType((prev) => ({ ...prev, [businessType]: rows }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load merge categories");
    } finally {
      setIsMergeCategoryLoading(false);
    }
  };

  const mergeCandidates = useMemo(() => {
    if (!mergeForRequestId) return [];
    const request = pendingRequests.find((item) => item.id === mergeForRequestId);
    if (!request) return [];

    const businessType = (request.businessType || "OTHER").toUpperCase();
    const all = categoriesByType[businessType] || [];
    const q = mergeSearch.trim().toLowerCase();
    if (!q) return all;

    return all.filter((item) =>
      item.nameBn.toLowerCase().includes(q) || (item.nameEn || "").toLowerCase().includes(q),
    );
  }, [categoriesByType, mergeForRequestId, mergeSearch, pendingRequests]);

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
                  <button className="rounded-lg border px-3 py-1 text-xs" disabled={moderatingId === item.id} onClick={() => openMergePicker(item)}>Merge</button>
                  <button className="rounded-lg border border-error px-3 py-1 text-xs text-error" disabled={moderatingId === item.id} onClick={() => handleDecision(item.id, "REJECT")}>Reject</button>
                </div>

                {mergeForRequestId === item.id ? (
                  <div className="mt-3 rounded-lg border border-outline-variant/30 p-3">
                    <p className="mb-2 text-xs text-on-surface-variant">Select merge target category</p>
                    <input
                      className="mb-2 w-full rounded-md border border-outline-variant/30 bg-surface px-2 py-1 text-sm"
                      placeholder="Search category by name..."
                      value={mergeSearch}
                      onChange={(e) => setMergeSearch(e.target.value)}
                    />
                    <select
                      className="w-full rounded-md border border-outline-variant/30 bg-surface px-2 py-1 text-sm"
                      value={mergeSelectedCategoryId}
                      onChange={(e) => setMergeSelectedCategoryId(e.target.value)}
                      disabled={isMergeCategoryLoading}
                    >
                      <option value="">Select a category</option>
                      {mergeCandidates.slice(0, 50).map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.nameBn}{candidate.nameEn ? ` / ${candidate.nameEn}` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 flex gap-2">
                      <button
                        className="rounded-lg border px-3 py-1 text-xs"
                        disabled={!mergeSelectedCategoryId || moderatingId === item.id}
                        onClick={async () => {
                          await handleDecision(item.id, "MERGE", mergeSelectedCategoryId);
                          setMergeForRequestId(null);
                          setMergeSelectedCategoryId("");
                        }}
                      >
                        Confirm Merge
                      </button>
                      <button
                        className="rounded-lg border px-3 py-1 text-xs"
                        onClick={() => setMergeForRequestId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
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
