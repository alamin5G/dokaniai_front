'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  BusinessCreateRequest,
  BusinessUpdateRequest,
  BusinessResponse,
  BusinessStatsResponse,
  BusinessOnboardingResponse,
  OnboardingStatsResponse,
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

  // Stats cache (active business)
  stats: BusinessStatsResponse | null;

  // Per-business stats map (for businesses list page)
  businessStatsMap: Record<string, BusinessStatsResponse>;

  // Onboarding (active business)
  onboardingData: BusinessOnboardingResponse | null;

  // Onboarding — incomplete list (endpoint #14)
  incompleteOnboardings: BusinessOnboardingResponse[];

  // Onboarding — aggregate stats (endpoint #15)
  onboardingStats: OnboardingStatsResponse | null;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;

  // Actions
  setActiveBusiness: (business: BusinessResponse) => void;
  clearActiveBusiness: () => void;
  loadBusinesses: () => Promise<void>;
  loadBusiness: (businessId: string) => Promise<BusinessResponse>;
  loadStats: (businessId: string) => Promise<void>;
  loadOnboarding: (businessId: string) => Promise<void>;
  loadIncompleteOnboardings: (maxStep?: number) => Promise<void>;
  loadOnboardingStats: () => Promise<void>;
  loadBusinessStatsMap: (businessIds: string[]) => Promise<void>;
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
  businessStatsMap: {} as Record<string, BusinessStatsResponse>,
  onboardingData: null as BusinessOnboardingResponse | null,
  incompleteOnboardings: [] as BusinessOnboardingResponse[],
  onboardingStats: null as OnboardingStatsResponse | null,
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

      // ---- Single business (endpoint #2) ----

      loadBusiness: async (businessId: string) => {
        const business = await businessApi.getBusiness(businessId);
        const { businesses, activeBusinessId } = get();
        set({
          businesses: businesses.map((b) => (b.id === businessId ? business : b)),
          activeBusiness: activeBusinessId === businessId ? business : get().activeBusiness,
        });
        return business;
      },

      // ---- Stats (active business) ----

      loadStats: async (businessId: string) => {
        const stats = await businessApi.getBusinessStats(businessId);
        set({ stats });
      },

      // ---- Per-business stats map (for businesses list page) ----

      loadBusinessStatsMap: async (businessIds: string[]) => {
        const map = { ...get().businessStatsMap };
        await Promise.all(
          businessIds.map(async (id) => {
            try {
              map[id] = await businessApi.getBusinessStats(id);
            } catch {
              // Skip failed individual stats — don't block the rest
            }
          }),
        );
        set({ businessStatsMap: map });
      },

      // ---- Onboarding (single business) ----

      loadOnboarding: async (businessId: string) => {
        const onboardingData = await businessApi.getOnboarding(businessId);
        set({ onboardingData });
      },

      // ---- Onboarding — incomplete list (endpoint #14) ----

      loadIncompleteOnboardings: async (maxStep?: number) => {
        const incompleteOnboardings = await businessApi.listIncompleteOnboarding(maxStep);
        set({ incompleteOnboardings });
      },

      // ---- Onboarding — aggregate stats (endpoint #15) ----

      loadOnboardingStats: async () => {
        const onboardingStats = await businessApi.getOnboardingStats();
        set({ onboardingStats });
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
