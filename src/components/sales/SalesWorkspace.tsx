"use client";

import { useBusinessStore } from "@/store/businessStore";
import type { CategoryResponse } from "@/types/category";
import type { Product } from "@/types/product";
import type {
    CartItem,
    DiscountMethod,
    DiscountRequest,
    PaymentMethod,
    SaleCreateRequest,
} from "@/types/sale";
import { createSale } from "@/lib/saleApi";
import { getCategoriesByBusinessType } from "@/lib/categoryApi";
import { listProducts } from "@/lib/productApi";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import ProductSelector from "./ProductSelector";
import CartPanel from "./CartPanel";

export default function SalesWorkspace({
    businessId,
}: {
    businessId: string;
}) {
    const t = useTranslations("shop.sales");
    const activeBusiness = useBusinessStore((state) => state.activeBusiness);

    // Products & Categories
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Cart
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // Discount
    const [discountMethod, setDiscountMethod] = useState<DiscountMethod>("FIXED");
    const [discountValue, setDiscountValue] = useState("");

    // Sale submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // Load categories
    useEffect(() => {
        if (!activeBusiness?.type) return;
        let cancelled = false;
        const loadCategories = async () => {
            try {
                const cats = await getCategoriesByBusinessType(activeBusiness.type);
                if (!cancelled) setCategories(cats);
            } catch {
                // Categories are optional
            }
        };
        void loadCategories();
        return () => { cancelled = true; };
    }, [activeBusiness?.type]);

    // Load products
    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await listProducts(businessId, {
                page: 0,
                size: 200,
                search: searchQuery.trim() || undefined,
                status: "ACTIVE",
                category: selectedCategoryId || undefined,
            });
            setProducts(response.content);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [businessId, searchQuery, selectedCategoryId, t]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadProducts();
        }, 200);
        return () => window.clearTimeout(timer);
    }, [loadProducts]);

    // Cart calculations
    const subtotal = useMemo(
        () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        [cartItems],
    );

    const discountAmount = useMemo(() => {
        const val = parseFloat(discountValue);
        if (isNaN(val) || val <= 0) return 0;
        if (discountMethod === "PERCENTAGE") {
            return Math.min((subtotal * val) / 100, subtotal);
        }
        return Math.min(val, subtotal);
    }, [discountValue, discountMethod, subtotal]);

    const total = useMemo(() => Math.max(subtotal - discountAmount, 0), [subtotal, discountAmount]);

    // Cart actions
    function handleAddProduct(product: Product) {
        setCartItems((prev) => {
            const existing = prev.find((ci) => ci.productId === product.id);
            if (existing) {
                return prev.map((ci) =>
                    ci.productId === product.id
                        ? { ...ci, quantity: ci.quantity + 1 }
                        : ci,
                );
            }
            return [
                ...prev,
                {
                    productId: product.id,
                    productName: product.name,
                    unit: product.unit,
                    unitPrice: product.sellPrice,
                    costPrice: product.costPrice,
                    quantity: 1,
                    stockQty: product.stockQty,
                },
            ];
        });
        setNotice(null);
        setError(null);
    }

    function handleQuantityChange(productId: string, delta: number) {
        setCartItems((prev) =>
            prev
                .map((ci) =>
                    ci.productId === productId
                        ? { ...ci, quantity: ci.quantity + delta }
                        : ci,
                )
                .filter((ci) => ci.quantity > 0),
        );
    }

    function handleClearAll() {
        setCartItems([]);
        setDiscountValue("");
        setError(null);
        setNotice(null);
    }

    // Sale submission
    async function handleSubmit(paymentMethod: PaymentMethod) {
        if (cartItems.length === 0) return;

        setIsSubmitting(true);
        setError(null);
        setNotice(null);

        // Validate stock
        for (const item of cartItems) {
            if (item.quantity > item.stockQty) {
                setError(t("cart.errorStock", { product: item.productName }));
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const discounts: DiscountRequest[] =
                discountAmount > 0
                    ? [
                        {
                            discountType: "CUSTOM",
                            discountMethod,
                            value: parseFloat(discountValue),
                            reason: "POS discount",
                        },
                    ]
                    : [];

            const request: SaleCreateRequest = {
                items: cartItems.map((ci) => ({
                    productId: ci.productId,
                    productName: ci.productName,
                    quantity: ci.quantity,
                    unitPrice: ci.unitPrice,
                })),
                discounts,
                paymentMethod,
                recordedVia: "MANUAL",
            };

            const sale = await createSale(businessId, request);
            setNotice(
                t("cart.success", { invoice: sale.invoiceNumber }),
            );
            setCartItems([]);
            setDiscountValue("");
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : t("cart.error"),
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex flex-1 overflow-hidden">
            {/* Left: Product Selection */}
            <ProductSelector
                products={products}
                categories={categories}
                isLoading={isLoading}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategoryId={selectedCategoryId}
                onCategorySelect={setSelectedCategoryId}
                onAddProduct={handleAddProduct}
                cartItems={cartItems}
            />

            {/* Right: Cart Panel */}
            <CartPanel
                cartItems={cartItems}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={(productId) => handleQuantityChange(productId, -Infinity)}
                onClearAll={handleClearAll}
                discountMethod={discountMethod}
                onDiscountMethodChange={setDiscountMethod}
                discountValue={discountValue}
                onDiscountValueChange={setDiscountValue}
                discountAmount={discountAmount}
                subtotal={subtotal}
                total={total}
                isSubmitting={isSubmitting}
                onSubmitCash={() => handleSubmit("CASH")}
                onSubmitCredit={() => handleSubmit("CREDIT")}
                error={error}
                notice={notice}
            />
        </div>
    );
}
