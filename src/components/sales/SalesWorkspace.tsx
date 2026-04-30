"use client";

import { useBusinessStore } from "@/store/businessStore";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types/product";
import type {
    DiscountMethod,
    DiscountRequest,
    PaymentMethod,
    SaleCreateRequest,
} from "@/types/sale";
import { useProducts } from "@/hooks/useProducts";
import { useCategoriesByBusinessType } from "@/hooks/useCategories";
import { useSaleMutations } from "@/hooks/useSaleMutations";
import { useSSEStockAlerts } from "@/hooks/useSSEStockAlerts";
import { getBusinessSettings, getBusinessProfile, getBusinessLocation } from "@/lib/businessApi";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { StockConflictDetail } from "@/components/sales/StockConflictModal";
import type { SaleCreatedResponse } from "@/types/sale";
import CashSaleSuccessModal from "@/components/sales/CashSaleSuccessModal";
import CustomerPickerDialog from "@/components/sales/CustomerPickerDialog";
import CreditSaleSuccessModal from "@/components/sales/CreditSaleSuccessModal";
import type { CustomerResponse } from "@/types/due";
import type { CartSuggestion } from "@/lib/cartIntelligenceApi";
import type { InvoiceBusinessInfo } from "@/lib/invoiceShare";

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
    const { products, isLoading, mutate: mutateProducts } = useProducts(businessId, {
        page: 0,
        size: 200,
        search: searchQuery.trim() || undefined,
        category: selectedCategoryId || undefined,
    });
    const { categories } = useCategoriesByBusinessType(activeBusiness?.type ?? null);

    // Cart — persisted via Zustand + localStorage (survives page navigation & tab close)
    const cartStore = useCartStore(businessId);
    const cartItems = cartStore((s) => s.cartItems);
    const discountMethod = cartStore((s) => s.discountMethod);
    const discountValue = cartStore((s) => s.discountValue);
    const givenAmount = cartStore((s) => s.givenAmount);
    const { addOrUpdateItem, updateQuantity, setQuantity, removeItem, clearAll, setDiscountMethod, setDiscountValue, setGivenAmount } = cartStore.getState();

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

    // Cash sale success modal
    const [cashSaleResult, setCashSaleResult] = useState<SaleCreatedResponse | null>(null);

    // Snapshot of cart items before clear — needed for invoice text in success modals
    const [lastCartItems, setLastCartItems] = useState<import("@/types/sale").CartItem[]>([]);

    // Credit sale: customer picker
    const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse | null>(null);

    // Cash sale: customer picker (optional — with Skip)
    const [cashCustomerPickerOpen, setCashCustomerPickerOpen] = useState(false);
    const [cashSaleCustomer, setCashSaleCustomer] = useState<CustomerResponse | null>(null);

    // Credit sale success modal
    const [creditSaleResult, setCreditSaleResult] = useState<SaleCreatedResponse | null>(null);

    // Sale mutations — SWR-backed with cache invalidation
    const { submitCreate, submitForceCreate } = useSaleMutations(businessId);

    // §7.6.2: SSE-driven optimistic cache updates (no full DB re-fetch)
    useSSEStockAlerts(businessId);

    // Show UI toast on stock alerts (cache is already updated optimistically by the hook)
    useEffect(() => {
        const handleLowStock = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setNotice(t("cart.lowStockAlert", { product: detail?.productName ?? "Unknown" }));
        };
        const handleOutOfStock = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setError(t("cart.outOfStockAlert", { product: detail?.productName ?? "Unknown" }));
        };

        window.addEventListener("sse:low-stock-alert", handleLowStock);
        window.addEventListener("sse:out-of-stock-alert", handleOutOfStock);
        return () => {
            window.removeEventListener("sse:low-stock-alert", handleLowStock);
            window.removeEventListener("sse:out-of-stock-alert", handleOutOfStock);
        };
    }, [t]);

    // Profile & location for invoice sharing
    const [profileData, setProfileData] = useState<{ phone?: string; email?: string; contactPerson?: string; website?: string; facebookPage?: string } | null>(null);
    const [locationData, setLocationData] = useState<{ address?: string; city?: string; district?: string; postalCode?: string; country?: string } | null>(null);

    // Load tax settings + profile + location
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
        const loadProfileAndLocation = async () => {
            try {
                const [profile, location] = await Promise.allSettled([
                    getBusinessProfile(businessId),
                    getBusinessLocation(businessId),
                ]);
                if (!cancelled) {
                    if (profile.status === "fulfilled") {
                        const p = profile.value;
                        setProfileData({
                            phone: p.phone || undefined,
                            email: p.email || undefined,
                            contactPerson: p.contactPerson || undefined,
                            website: p.website || undefined,
                            facebookPage: p.facebookPage || undefined,
                        });
                    }
                    if (location.status === "fulfilled") {
                        const loc = location.value;
                        setLocationData({
                            address: loc.address || undefined,
                            city: loc.city || undefined,
                            district: loc.district || undefined,
                            postalCode: loc.postalCode || undefined,
                            country: loc.country || undefined,
                        });
                    }
                }
            } catch {
                // Profile/location are optional for invoice
            }
        };
        void loadSettings();
        void loadProfileAndLocation();
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

    const givenAmountValue = useMemo(() => {
        if (givenAmount === "") return total;
        const parsed = parseFloat(givenAmount);
        if (isNaN(parsed) || parsed < 0) return total;
        return Math.min(parsed, total);
    }, [givenAmount, total]);

    const dueAmount = useMemo(
        () => Math.max(0, total - givenAmountValue),
        [total, givenAmountValue],
    );

    // Cart actions
    function handleAddProduct(product: Product) {
        // Guard: block out-of-stock products from being added
        if (product.stockQty <= 0 || product.status === "OUT_OF_STOCK") return;

        addOrUpdateItem({
            id: product.id,
            name: product.name,
            unit: product.unit,
            sellPrice: product.sellPrice,
            costPrice: product.costPrice,
            stockQty: product.stockQty,
        });
        setNotice(null);
        setError(null);
    }

    /** Handle AI cart suggestion click — add suggested product to cart */
    function handleAddSuggestion(suggestion: CartSuggestion) {
        addOrUpdateItem({
            id: suggestion.productId,
            name: suggestion.productName,
            unit: suggestion.unit ?? "pcs",
            sellPrice: suggestion.unitPrice,
            costPrice: 0,
            stockQty: suggestion.stockQuantity,
        });
        setNotice(null);
        setError(null);
    }

    function handleQuantityChange(productId: string, delta: number) {
        updateQuantity(productId, delta);
    }

    function handleQuantitySet(productId: string, newQuantity: number) {
        setQuantity(productId, newQuantity);
    }

    function handleClearAll() {
        clearAll();
        setError(null);
        setNotice(null);
    }

    // Build sale request payload (shared between normal & force submit)
    function buildSaleRequest(paymentMethod: PaymentMethod, customer?: CustomerResponse | null): SaleCreateRequest {
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

        const effectiveCustomer = customer ?? (paymentMethod === "CREDIT" ? selectedCustomer : cashSaleCustomer);

        // Calculate amountPaid based on givenAmount input
        const parsedGiven = givenAmount === "" ? total : Math.min(Math.max(parseFloat(givenAmount) || 0, 0), total);
        const amountPaid = paymentMethod === "CASH" ? total : parsedGiven;

        return {
            items: cartItems.map((ci) => ({
                productId: ci.productId,
                productName: ci.productName,
                quantity: ci.quantity,
                unitPrice: ci.unitPrice,
            })),
            discounts,
            paymentMethod,
            amountPaid,
            recordedVia: "MANUAL",
            customerId: effectiveCustomer?.id ?? null,
        };
    }

    // Sale submission — accepts optional customer override to avoid stale state
    async function handleSubmit(paymentMethod: PaymentMethod, customer?: CustomerResponse | null) {
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
            const request = buildSaleRequest(paymentMethod, customer);
            const sale = await submitCreate(request);
            // Snapshot cart items before clearing for invoice sharing
            setLastCartItems([...cartItems]);
            if (paymentMethod === "CASH") {
                setCashSaleResult(sale);
            } else {
                // Use the customer passed directly (not stale state)
                setSelectedCustomer(customer ?? selectedCustomer);
                setCreditSaleResult(sale);
            }
            clearAll();
        } catch (submitError: unknown) {
            // Check for 409 STOCK_CONFLICT from backend
            const axiosErr = submitError as { response?: { status?: number; data?: { error?: { code?: string; message?: string; details?: StockConflictDetail } } } };
            if (
                axiosErr.response?.status === 409 &&
                axiosErr.response?.data?.error?.code === "STOCK_CONFLICT" &&
                axiosErr.response?.data?.error?.details
            ) {
                setConflictDetail(axiosErr.response.data.error.details);
                setPendingRequest(buildSaleRequest(paymentMethod, customer));
                setConflictOpen(true);
            } else {
                // Prefer server-provided error message over raw Axios string
                const serverMessage = axiosErr.response?.data?.error?.message;
                setError(
                    serverMessage
                        ? serverMessage
                        : submitError instanceof Error
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
            setLastCartItems([...cartItems]);
            if (pendingRequest.paymentMethod === "CASH") {
                setCashSaleResult(sale);
            } else {
                setNotice(t("cart.success", { invoice: sale.invoiceNumber }));
            }
            clearAll();
        } catch (submitError: unknown) {
            const forceErr = submitError as { response?: { data?: { error?: { message?: string } } } };
            const serverMsg = forceErr.response?.data?.error?.message;
            setError(
                serverMsg
                    ? serverMsg
                    : submitError instanceof Error
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

    // Business info for invoice sharing
    const businessInfo: InvoiceBusinessInfo = useMemo(() => ({
        name: activeBusiness?.name ?? "DokaniAI",
        phone: profileData?.phone,
        email: profileData?.email,
        contactPerson: profileData?.contactPerson,
        website: profileData?.website,
        facebookPage: profileData?.facebookPage,
        address: locationData?.address,
        city: locationData?.city,
        district: locationData?.district,
        postalCode: locationData?.postalCode,
        country: locationData?.country,
    }), [activeBusiness, profileData, locationData]);

    return (
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden h-[calc(100vh-12rem)]">
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
                onRemoveItem={removeItem}
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
                givenAmount={givenAmount}
                onGivenAmountChange={setGivenAmount}
                isSubmitting={isSubmitting}
                onSubmitCash={() => setCashCustomerPickerOpen(true)}
                onSubmitCredit={() => setCustomerPickerOpen(true)}
                error={error}
                notice={notice}
                businessId={businessId}
                onAddSuggestion={handleAddSuggestion}
            />

            {/* Stock Conflict Modal */}
            <StockConflictModal
                open={conflictOpen}
                onClose={handleConflictDiscard}
                conflict={conflictDetail}
                onConfirm={handleConflictConfirm}
                onDiscard={handleConflictDiscard}
            />

            {/* Cash Sale: Customer Picker (optional — with Skip button) */}
            <CustomerPickerDialog
                businessId={businessId}
                open={cashCustomerPickerOpen}
                onClose={() => setCashCustomerPickerOpen(false)}
                onSelect={(customer) => {
                    setCashCustomerPickerOpen(false);
                    setCashSaleCustomer(customer);
                    // Submit cash sale with the selected customer
                    handleSubmit("CASH", customer);
                }}
                onSkip={() => {
                    setCashCustomerPickerOpen(false);
                    setCashSaleCustomer(null);
                    // Submit cash sale without customer (walk-in)
                    handleSubmit("CASH", null);
                }}
            />

            {/* Cash Sale Success Modal */}
            {cashSaleResult && (
                <CashSaleSuccessModal
                    result={cashSaleResult}
                    cartItems={lastCartItems}
                    businessInfo={businessInfo}
                    businessId={businessId}
                    customerName={cashSaleCustomer?.name ?? null}
                    onClose={() => {
                        setCashSaleResult(null);
                        setCashSaleCustomer(null);
                    }}
                />
            )}

            {/* Credit Sale: Customer Picker (mandatory — no Skip button) */}
            <CustomerPickerDialog
                businessId={businessId}
                open={customerPickerOpen}
                onClose={() => setCustomerPickerOpen(false)}
                onSelect={(customer) => {
                    setCustomerPickerOpen(false);
                    // Defensive: ensure customer has a valid ID before submitting credit sale
                    if (!customer?.id) {
                        console.error("[CREDIT SALE] Customer object missing id:", customer);
                        setError(t("cart.error") + " — Customer ID missing. Please try again.");
                        return;
                    }
                    console.log("[CREDIT SALE] Submitting with customer:", { id: customer.id, name: customer.name });
                    handleSubmit("CREDIT", customer);
                }}
            />

            {/* Credit Sale Success Modal */}
            {creditSaleResult && (
                <CreditSaleSuccessModal
                    result={creditSaleResult}
                    customerName={selectedCustomer?.name ?? ""}
                    cartItems={lastCartItems}
                    businessInfo={businessInfo}
                    businessId={businessId}
                    onClose={() => {
                        setCreditSaleResult(null);
                        setSelectedCustomer(null);
                    }}
                />
            )}
        </div>
    );
}