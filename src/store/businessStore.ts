'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  BusinessCreateRequest,
  BusinessUpdateRequest,
  BusinessResponse,
  BusinessStatsResponse,
  BusinessOnboardingResponse,
} from '@/types/business';
import * as businessApi from '@/lib/businessApi';

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

interface BusinessState {
  // Active business context
  activeBusinessId: string | null;
  activeBusiness: BusinessResponse | null;

  // Business list cache
  businesses: BusinessResponse[];
  totalCount: number;

  // Stats cache
  stats: BusinessStatsResponse | null;

  // Onboarding
  onboardingData: BusinessOnboardingResponse | null;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;

  // Actions
  setActiveBusiness: (business: BusinessResponse) => void;
  clearActiveBusiness: () => void;
  loadBusinesses: () => Promise<void>;
  loadStats: (businessId: string) => Promise<void>;
  loadOnboarding: (businessId: string) => Promise<void>;
  createBusiness: (data: BusinessCreateRequest) => Promise<BusinessResponse>;
  updateBusiness: (businessId: string, data: BusinessUpdateRequest) => Promise<void>;
  archiveBusiness: (businessId: string) => Promise<void>;
  deleteBusiness: (businessId: string) => Promise<void>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Initial state (used by reset)
// ---------------------------------------------------------------------------

const initialState = {
  activeBusinessId: null as string | null,
  activeBusiness: null as BusinessResponse | null,
  businesses: [] as BusinessResponse[],
  totalCount: 0,
  stats: null as BusinessStatsResponse | null,
  onboardingData: null as BusinessOnboardingResponse | null,
  isLoading: false,
  isCreating: false,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ---- Active business ----

      setActiveBusiness: (business: BusinessResponse) => {
        set({
          activeBusinessId: business.id,
          activeBusiness: business,
        });
      },

      clearActiveBusiness: () => {
        set({
          activeBusinessId: null,
          activeBusiness: null,
          stats: null,
          onboardingData: null,
        });
      },

      // ---- Business list ----

      loadBusinesses: async () => {
        set({ isLoading: true });
        try {
          const result = await businessApi.listBusinesses();
          set({
            businesses: result.businesses,
            totalCount: result.total,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // ---- Stats ----

      loadStats: async (businessId: string) => {
        const stats = await businessApi.getBusinessStats(businessId);
        set({ stats });
      },

      // ---- Onboarding ----

      loadOnboarding: async (businessId: string) => {
        const onboardingData = await businessApi.getOnboarding(businessId);
        set({ onboardingData });
      },

      // ---- CRUD ----

      createBusiness: async (data: BusinessCreateRequest) => {
        set({ isCreating: true });
        try {
          const business = await businessApi.createBusiness(data);
          const { businesses, totalCount } = get();
          set({
            businesses: [...businesses, business],
            totalCount: totalCount + 1,
          });
          return business;
        } finally {
          set({ isCreating: false });
        }
      },

      updateBusiness: async (businessId: string, data: BusinessUpdateRequest) => {
        const updated = await businessApi.updateBusiness(businessId, data);
        const { businesses, activeBusiness, activeBusinessId } = get();
        set({
          businesses: businesses.map((b) => (b.id === businessId ? updated : b)),
          activeBusiness:
            activeBusinessId === businessId ? updated : activeBusiness,
        });
      },

      archiveBusiness: async (businessId: string) => {
        await businessApi.archiveBusiness(businessId);
        const { businesses, activeBusiness, activeBusinessId } = get();
        const updatedList = businesses.map((b) =>
          b.id === businessId ? { ...b, status: 'ARCHIVED' as const } : b,
        );
        set({
          businesses: updatedList,
          activeBusiness:
            activeBusinessId === businessId
              ? { ...activeBusiness!, status: 'ARCHIVED' }
              : activeBusiness,
        });
      },

      deleteBusiness: async (businessId: string) => {
        await businessApi.deleteBusiness(businessId);
        const { businesses, activeBusinessId } = get();
        const filtered = businesses.filter((b) => b.id !== businessId);
        set({
          businesses: filtered,
          totalCount: filtered.length,
          activeBusinessId:
            activeBusinessId === businessId ? null : activeBusinessId,
          activeBusiness:
            activeBusinessId === businessId ? null : get().activeBusiness,
        });
      },

      // ---- Reset ----

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'dokaniai-business-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist the active business context, not loading states or caches
      partialize: (state) => ({
        activeBusinessId: state.activeBusinessId,
        activeBusiness: state.activeBusiness,
      }),
    },
  ),
);
