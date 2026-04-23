import { create } from 'zustand';
import {
    getAvailablePlans,
    getCurrentSubscription,
    getPlanLimits,
    getReferralStatus,
    invalidateCurrentSubscriptionCache,
} from '@/lib/subscriptionApi';
import type {
    Plan,
    Subscription,
    PlanLimits,
    ReferralStatus,
    PaymentIntentStatusResponse,
} from '@/types/subscription';

interface SubscriptionState {
    /** Cached data */
    plans: Plan[];
    subscription: Subscription | null;
    planLimits: PlanLimits | null;
    referralStatus: ReferralStatus | null;

    /** Loading flags */
    loading: boolean;

    /** Actions */
    refreshAll: () => Promise<void>;
    refreshSubscription: () => Promise<void>;
    refreshReferralStatus: () => Promise<void>;
    refreshPlanLimits: () => Promise<void>;

    /** SSE-driven updates */
    handlePaymentStatusChange: (data: { paymentIntentId: string; status: string }) => void;
    handleSubscriptionChange: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    plans: [],
    subscription: null,
    planLimits: null,
    referralStatus: null,
    loading: false,

    refreshAll: async () => {
        set({ loading: true });
        try {
            const [plans, subscription, planLimits, referralStatus] = await Promise.all([
                getAvailablePlans().catch(() => []),
                getCurrentSubscription().catch(() => null),
                getPlanLimits().catch(() => null),
                getReferralStatus().catch(() => null),
            ]);
            invalidateCurrentSubscriptionCache();
            set({ plans, subscription, planLimits, referralStatus, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    refreshSubscription: async () => {
        try {
            invalidateCurrentSubscriptionCache();
            const subscription = await getCurrentSubscription();
            set({ subscription });
        } catch {
            // silent
        }
    },

    refreshReferralStatus: async () => {
        try {
            const referralStatus = await getReferralStatus();
            set({ referralStatus });
        } catch {
            // silent
        }
    },

    refreshPlanLimits: async () => {
        try {
            const planLimits = await getPlanLimits();
            set({ planLimits });
        } catch {
            // silent
        }
    },

    handlePaymentStatusChange: (_data: { paymentIntentId: string; status: string }) => {
        // When payment status changes, refresh subscription data
        // The component will pick up the new state from the store
        void get().refreshSubscription();
    },

    handleSubscriptionChange: () => {
        void get().refreshAll();
    },
}));
