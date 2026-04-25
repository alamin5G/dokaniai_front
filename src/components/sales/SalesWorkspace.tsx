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
import { useProducts } from "@/hooks/useProducts";
import { useCategoriesByBusinessType } from "@/hooks/useCategories";
import { useSaleMutations } from "@/hooks/useSaleMutations";
import { getBusinessSettings } from "@/lib/businessApi";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { StockConflictDetail } from "@/components/sales/StockConflictModal";

import ProductSelector from "./ProductSelector";
import CartPanel from "./CartPanel";
import StockConflictModal from "./StockConflictModal";

export default function SalesWorkspace({
    businessId,
}: {
    businessId: string;
}) {
    const t = useTranslations("shop.sales");
    const activeBusiness = useBusinessStore((state) => state.activeBusiness);

    // Search & filter state (drives SWR keys)
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // Products & Categories — SWR-backed (shared cache across components)
    const { products, isLoading } = useProducts(businessId, {
        page: 0,
        size: 200,
        search: searchQuery.trim() || undefined,
        status: "ACTIVE",
        category: selectedCategoryId || undefined,
    });
    const { categories } = useCategoriesByBusinessType(activeBusiness?.type ?? null);

    // Cart
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // Discount
    const [discountMethod, setDiscountMethod] = useState<DiscountMethod>("FIXED");
    const [discountValue, setDiscountValue] = useState("");

    // Tax settings
    const [taxEnabled, setTaxEnabled] = useState(false);
    const [taxRate, setTaxRate] = useState(0);

    // Sale submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // Stock conflict
    const [conflictOpen, setConflictOpen] = useState(false);
    const [conflictDetail, setConflictDetail] = useState<StockConflictDetail | null>(null);
    const [pendingRequest, setPendingRequest] = useState<SaleCreateRequest | null>(null);

    // Sale mutations — SWR-backed with cache invalidation
    const { submitCreate, submitForceCreate } = useSaleMutations(businessId);

    // Load tax settings
    useEffect(() => {
        let cancelled = false;
        const loadSettings = async () => {
            try {
                const settings = await getBusinessSettings(businessId);
                if (!cancelled) {
                    setTaxEnabled(settings.taxEnabled ?? false);
                    setTaxRate(settings.taxRate ?? 0);
                }
            } catch {
                // Tax settings are optional — default to no tax
            }
        };
        void loadSettings();
        return () => { cancelled = true; };
    }, [businessId]);

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

    const taxAmount = useMemo(() => {
        if (!taxEnabled || taxRate <= 0) return 0;
        return Math.round((subtotal - discountAmount) * taxRate) / 100;
    }, [subtotal, discountAmount, taxEnabled, taxRate]);

    const total = useMemo(
        () => Math.max(subtotal - discountAmount + taxAmount, 0),
        [subtotal, discountAmount, taxAmount],
    );

    // Cart actions
    function handleAddProduct(product: Product) {
        // Guard: block out-of-stock products from being added
        if (product.stockQty <= 0 || product.status === 'OUT_OF_STOCK') return;

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

    function handleQuantitySet(productId: string, newQuantity: number) {
        if (newQuantity <= 0) {
            setCartItems((prev) => prev.filter((ci) => ci.productId !== productId));
        } else {
            setCartItems((prev) =>
                prev.map((ci) =>
                    ci.productId === productId
                        ? { ...ci, quantity: newQuantity }
                        : ci,
                ),
            );
        }
    }

    function handleClearAll() {
        setCartItems([]);
        setDiscountValue("");
        setError(null);
        setNotice(null);
    }

    // Build sale request payload (shared between normal & force submit)
    function buildSaleRequest(paymentMethod: PaymentMethod): SaleCreateRequest {
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

        return {
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
    }

    // Sale submission
    async function handleSubmit(paymentMethod: PaymentMethod) {
        if (cartItems.length === 0) return;

        setIsSubmitting(true);
        setError(null);
        setNotice(null);

        // Validate stock (client-side pre-check)
        for (const item of cartItems) {
            if (item.quantity > item.stockQty) {
                setError(t("cart.errorStock", { product: item.productName }));
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const request = buildSaleRequest(paymentMethod);
            const sale = await submitCreate(request);
            setNotice(
                t("cart.success", { invoice: sale.invoiceNumber }),
            );
            setCartItems([]);
            setDiscountValue("");
        } catch (submitError: unknown) {
            // Check for 409 STOCK_CONFLICT from backend
            const axiosErr = submitError as { response?: { status?: number; data?: { error?: { code?: string; details?: StockConflictDetail } } } };
            if (
                axiosErr.response?.status === 409 &&
                axiosErr.response?.data?.error?.code === "STOCK_CONFLICT" &&
                axiosErr.response?.data?.error?.details
            ) {
                setConflictDetail(axiosErr.response.data.error.details);
                setPendingRequest(buildSaleRequest(paymentMethod));
                setConflictOpen(true);
            } else {
                setError(
                    submitError instanceof Error
                        ? submitError.message
                        : t("cart.error"),
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    // Conflict modal: user confirms force sale
    async function handleConflictConfirm() {
        if (!pendingRequest) return;
        setConflictOpen(false);
        setIsSubmitting(true);
        setError(null);

        try {
            const sale = await submitForceCreate(pendingRequest);
            setNotice(t("cart.success", { invoice: sale.invoiceNumber }));
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
            setPendingRequest(null);
            setConflictDetail(null);
        }
    }

    // Conflict modal: user discards sale
    function handleConflictDiscard() {
        setConflictOpen(false);
        setConflictDetail(null);
        setPendingRequest(null);
        setError(null);
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
                onQuantitySet={handleQuantitySet}
                onRemoveItem={(productId) => handleQuantityChange(productId, -Infinity)}
                onClearAll={handleClearAll}
                discountMethod={discountMethod}
                onDiscountMethodChange={setDiscountMethod}
                discountValue={discountValue}
                onDiscountValueChange={setDiscountValue}
                discountAmount={discountAmount}
                subtotal={subtotal}
                taxRate={taxEnabled ? taxRate : 0}
                taxAmount={taxAmount}
                total={total}
                isSubmitting={isSubmitting}
                onSubmitCash={() => handleSubmit("CASH")}
                onSubmitCredit={() => handleSubmit("CREDIT")}
                error={error}
                notice={notice}
            />

            {/* Stock Conflict Modal */}
            <StockConflictModal
                open={conflictOpen}
                onClose={handleConflictDiscard}
                conflict={conflictDetail}
                onConfirm={handleConflictConfirm}
                onDiscard={handleConflictDiscard}
            />
        </div>
    );
}
