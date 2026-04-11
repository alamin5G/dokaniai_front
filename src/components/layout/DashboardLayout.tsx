"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useBusinessStore } from "@/store/businessStore";
import SideNavBar from "@/components/layout/SideNavBar";
import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";

// ---------------------------------------------------------------------------
// Spinner component (inline, no external deps)
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="w-10 h-10 rounded-full border-4 border-surface-container-high border-t-primary animate-spin" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

// ---------------------------------------------------------------------------
// DashboardLayout component
// ---------------------------------------------------------------------------

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const router = useRouter();
  const { status } = useAuthStore();
  const { activeBusiness, activeBusinessId, loadBusinesses, setActiveBusiness, businesses } = useBusinessStore();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function checkGuards() {
      // 1. Auth guard
      if (status !== "AUTHENTICATED") {
        router.replace("/login");
        return;
      }

      // 2. Business guard — if no active business, try loading the list
      if (!activeBusiness) {
        try {
          await loadBusinesses();
        } catch {
          // API call failed — will be handled by the store
        }
      }

      setIsReady(true);
    }

    checkGuards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // After businesses are loaded, check if we need to redirect
  useEffect(() => {
    if (isReady && !activeBusiness && businesses.length === 0) {
      router.replace("/businesses");
    } else if (isReady && !activeBusiness && businesses.length > 0) {
      // Auto-select the first active business
      const firstActive = businesses.find((b) => b.status === "ACTIVE");
      if (firstActive) {
        setActiveBusiness(firstActive);
      } else {
        router.replace("/businesses");
      }
    }
  }, [isReady, activeBusiness, businesses, router, setActiveBusiness]);

  // Show spinner while checking auth/business
  if (!isReady || !activeBusiness) {
    return <Spinner />;
  }

  return (
    <>
      {/* Desktop sidebar */}
      <SideNavBar />

      {/* Main content area */}
      <main className="md:ml-64 min-h-screen pb-28 md:pb-8">
        <TopAppBar title={title} />

        <div className="px-6 py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNavBar />
    </>
  );
}
