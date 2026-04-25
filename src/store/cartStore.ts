"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, DiscountMethod } from "@/types/sale";

/** Per-business cart state persisted to localStorage */
interface CartState {
    // Data (persisted)
    cartItems: CartItem[];
    discountMethod: DiscountMethod;
    discountValue: string;

    // Actions
    addItem: (item: CartItem) => void;
    addOrUpdateItem: (product: {
        id: string;
        name: string;
        unit: string;
        sellPrice: number;
        costPrice: number;
        stockQty: number;
    }) => void;
    updateQuantity: (productId: string, delta: number) => void;
    setQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    clearAll: () => void;
    setDiscountMethod: (method: DiscountMethod) => void;
    setDiscountValue: (value: string) => void;
}

/**
 * Creates a cart store scoped to a specific business.
 * We use a factory function so each business gets its own persisted slice.
 */
export function createCartStore(businessId: string) {
    return create<CartState>()(
        persist(
            (set) => ({
                cartItems: [],
                discountMethod: "FIXED" as DiscountMethod,
                discountValue: "",

                addItem: (item: CartItem) =>
                    set((state) => ({
                        cartItems: [...state.cartItems, item],
                    })),

                addOrUpdateItem: (product) =>
                    set((state) => {
                        const existing = state.cartItems.find(
                            (ci) => ci.productId === product.id,
                        );
                        if (existing) {
                            return {
                                cartItems: state.cartItems.map((ci) =>
                                    ci.productId === product.id
                                        ? { ...ci, quantity: ci.quantity + 1 }
                                        : ci,
                                ),
                            };
                        }
                        return {
                            cartItems: [
                                ...state.cartItems,
                                {
                                    productId: product.id,
                                    productName: product.name,
                                    unit: product.unit,
                                    unitPrice: product.sellPrice,
                                    costPrice: product.costPrice,
                                    quantity: 1,
                                    stockQty: product.stockQty,
                                },
                            ],
                        };
                    }),

                updateQuantity: (productId, delta) =>
                    set((state) => ({
                        cartItems: state.cartItems
                            .map((ci) =>
                                ci.productId === productId
                                    ? { ...ci, quantity: ci.quantity + delta }
                                    : ci,
                            )
                            .filter((ci) => ci.quantity > 0),
                    })),

                setQuantity: (productId, quantity) =>
                    set((state) => ({
                        cartItems:
                            quantity <= 0
                                ? state.cartItems.filter((ci) => ci.productId !== productId)
                                : state.cartItems.map((ci) =>
                                    ci.productId === productId
                                        ? { ...ci, quantity }
                                        : ci,
                                ),
                    })),

                removeItem: (productId) =>
                    set((state) => ({
                        cartItems: state.cartItems.filter((ci) => ci.productId !== productId),
                    })),

                clearAll: () =>
                    set({
                        cartItems: [],
                        discountValue: "",
                    }),

                setDiscountMethod: (method) =>
                    set({ discountMethod: method }),

                setDiscountValue: (value) =>
                    set({ discountValue: value }),
            }),
            {
                name: `dokaniai-cart-${businessId}`,
                storage: createJSONStorage(() => localStorage),
                // Only persist cart data, not functions
                partialize: (state) => ({
                    cartItems: state.cartItems,
                    discountMethod: state.discountMethod,
                    discountValue: state.discountValue,
                }),
            },
        ),
    );
}

/**
 * Singleton cache: one store instance per businessId.
 * Prevents re-creating the store on every re-render.
 */
const storeCache = new Map<string, ReturnType<typeof createCartStore>>();

export function useCartStore(businessId: string) {
    if (!storeCache.has(businessId)) {
        storeCache.set(businessId, createCartStore(businessId));
    }
    return storeCache.get(businessId)!;
}