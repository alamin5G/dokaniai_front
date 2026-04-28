"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
    CustomerDueSummary,
    CustomerResponse,
    DueTransaction,
    DueTransactionType,
    DueLedgerResponse,
} from "@/types/due";
import {
    getCustomersWithDue,
    listCustomers,
    createCustomer,
    createBaki,
    createJoma,
    createAdjustment,
    getCustomerDueLedger,
    generateDueReminder,
} from "@/lib/dueApi";
import ReminderPreviewModal from "./ReminderPreviewModal";

// ─── Helpers ─────────────────────────────────────────────

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

type Priority = "urgent" | "regular" | "new";

function getCustomerPriority(summary: CustomerDueSummary): Priority {
    if (!summary.lastPaymentDate && summary.totalBakiCount <= 1) return "new";
    if (summary.lastTransactionDate) {
        const daysSince = Math.floor(
            (Date.now() - new Date(summary.lastTransactionDate).getTime()) / 86400000
        );
        if (daysSince > 30 || summary.currentBalance > 10000) return "urgent";
    }
    return "regular";
}

function daysSincePayment(dateStr: string | null): number | null {
    if (!dateStr) return null;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// ─── Form States ─────────────────────────────────────────

interface TransactionFormState {
    customerId: string;
    type: DueTransactionType;
    amount: string;
    description: string;
    paymentMethod: string;
}

const initialTxForm: TransactionFormState = {
    customerId: "",
    type: "BAKI",
    amount: "",
    description: "",
    paymentMethod: "CASH",
};

interface CustomerFormState {
    name: string;
    phone: string;
    address: string;
    creditLimit: string;
}

const initialCustomerForm: CustomerFormState = {
    name: "",
    phone: "",
    address: "",
    creditLimit: "",
};

// ─── Component ───────────────────────────────────────────

export default function DueLedgerWorkspace({
    businessId,
    initialCustomerId,
}: {
    businessId: string;
    initialCustomerId?: string;
}) {
    const t = useTranslations("shop.dueLedger");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    const currencyFmt = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });

    function formatMoney(value: number | null | undefined): string {
        return currencyFmt.format(value ?? 0);
    }

    // ── Data state ──
    const [customersWithDue, setCustomersWithDue] = useState<CustomerDueSummary[]>([]);
    const [allCustomers, setAllCustomers] = useState<CustomerResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── UI state ──
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPriority, setFilterPriority] = useState<"all" | "urgent" | "regular" | "new">("all");
    const [filterAutoMfs, setFilterAutoMfs] = useState(false);
    const [showTxForm, setShowTxForm] = useState(false);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [ledgerData, setLedgerData] = useState<DueLedgerResponse | null>(null);
    const [txForm, setTxForm] = useState<TransactionFormState>(initialTxForm);
    const [custForm, setCustForm] = useState<CustomerFormState>(initialCustomerForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [reminderCustomer, setReminderCustomer] = useState<CustomerDueSummary | null>(null);

    // ── Computed stats ──
    const totalDue = useMemo(
        () => customersWithDue.reduce((sum, c) => sum + (c.currentBalance ?? 0), 0),
        [customersWithDue]
    );
    const todayRecovery = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return customersWithDue.reduce((sum, c) => {
            if (c.lastPaymentDate && c.lastPaymentDate.slice(0, 10) === today) {
                return sum + (c.totalJomaAmount ?? 0);
            }
            return sum;
        }, 0);
    }, [customersWithDue]);
    const overdueCount = useMemo(
        () =>
            customersWithDue.filter((c) => {
                const days = daysSincePayment(c.lastPaymentDate);
                return days !== null && days > 30;
            }).length,
        [customersWithDue]
    );

    // ── Filtered list ──
    const filteredCustomers = useMemo(() => {
        let list = customersWithDue;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (c) =>
                    c.customerName.toLowerCase().includes(q) ||
                    (c.currentBalance?.toString() ?? "").includes(q)
            );
        }
        if (filterPriority !== "all") {
            list = list.filter((c) => getCustomerPriority(c) === filterPriority);
        }
        return list;
    }, [customersWithDue, searchQuery, filterPriority]);

    // ── Filtered ledger transactions ──
    const filteredLedgerTransactions = useMemo(() => {
        if (!ledgerData) return [];
        let txs = ledgerData.transactions;
        if (filterAutoMfs) {
            txs = txs.filter((tx) => tx.recordedVia === "AUTO_MFS");
        }
        return txs;
    }, [ledgerData, filterAutoMfs]);

    // ── Load data ──
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [dueCustomers, customers] = await Promise.all([
                getCustomersWithDue(businessId),
                listCustomers(businessId, { size: 100 }),
            ]);
            setCustomersWithDue(dueCustomers);
            setAllCustomers(customers.content);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [businessId, t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ── Load ledger detail ──
    const loadLedger = useCallback(
        async (customerId: string) => {
            try {
                const data = await getCustomerDueLedger(businessId, customerId);
                setLedgerData(data);
                setSelectedCustomerId(customerId);
            } catch {
                setToast(t("messages.loadError"));
            }
        },
        [businessId, t]
    );

    useEffect(() => {
        if (initialCustomerId && !isLoading && !ledgerData) {
            loadLedger(initialCustomerId);
        }
    }, [initialCustomerId, isLoading, ledgerData, loadLedger]);

    // ── Toast auto-clear ──
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // ── Handlers ──
    function openTxForm(type: DueTransactionType, customerId?: string) {
        setTxForm({ ...initialTxForm, type, customerId: customerId ?? "" });
        setShowTxForm(true);
    }

    function openCustomerForm() {
        setCustForm(initialCustomerForm);
        setShowCustomerForm(true);
    }

    async function handleTxSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!txForm.customerId || !txForm.amount) return;
        setIsSubmitting(true);
        try {
            const request = {
                customerId: txForm.customerId,
                type: txForm.type,
                amount: parseFloat(txForm.amount),
                description: txForm.description || undefined,
                paymentMethod: txForm.paymentMethod,
            };
            if (txForm.type === "BAKI") {
                await createBaki(businessId, request);
                setToast(t("messages.bakiSuccess"));
            } else if (txForm.type === "JOMA") {
                await createJoma(businessId, request);
                setToast(t("messages.jomaSuccess"));
            } else {
                await createAdjustment(businessId, request);
                setToast(t("messages.adjustmentSuccess"));
            }
            setShowTxForm(false);
            loadData();
            if (selectedCustomerId) {
                loadLedger(selectedCustomerId);
            }
        } catch {
            setToast(t("messages.saveError"));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCustomerSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!custForm.name) return;
        setIsSubmitting(true);
        try {
            await createCustomer(businessId, {
                name: custForm.name,
                phone: custForm.phone || undefined,
                address: custForm.address || undefined,
                creditLimit: custForm.creditLimit ? parseFloat(custForm.creditLimit) : undefined,
            });
            setToast(t("messages.customerCreated"));
            setShowCustomerForm(false);
            loadData();
        } catch {
            setToast(t("messages.customerError"));
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleOpenReminder(customerId: string) {
        const customer = customersWithDue.find((c) => c.customerId === customerId);
        if (customer) {
            setReminderCustomer(customer);
        }
    }

    function handleReminderSent() {
        setReminderCustomer(null);
        setToast(t("messages.reminderSent"));
        loadData();
    }

    async function handleBulkReminders() {
        // Get overdue customers (30+ days)
        const overdueCustomers = customersWithDue.filter((c) => {
            const days = daysSincePayment(c.lastPaymentDate);
            return days !== null && days > 30;
        });

        if (overdueCustomers.length === 0) {
            setToast(t("messages.loadError"));
            return;
        }

        // Generate and open WhatsApp links sequentially with a small delay
        let count = 0;
        for (const customer of overdueCustomers.slice(0, 5)) {
            try {
                const link = await generateDueReminder(businessId, customer.customerId);
                if (link.link) {
                    window.open(link.link, "_blank");
                    count++;
                    // Small delay to prevent browser from blocking popups
                    await new Promise((r) => setTimeout(r, 800));
                }
            } catch {
                // Skip failed customers
            }
        }
        setToast(`${count} ${t("messages.reminderBulkSent")}`);
    }

    // ── Priority badge classes ──
    function priorityBadge(priority: Priority) {
        switch (priority) {
            case "urgent":
                return "bg-tertiary text-white";
            case "regular":
                return "bg-secondary text-white";
            case "new":
                return "bg-outline-variant text-on-surface-variant";
        }
    }

    function priorityLabel(priority: Priority) {
        return t(`customerList.priority.${priority}`);
    }

    // ── Due amount color ──
    function dueAmountColor(priority: Priority) {
        switch (priority) {
            case "urgent":
                return "text-tertiary";
            case "regular":
                return "text-primary";
            case "new":
                return "text-primary";
        }
    }

    // ════════════════════════════════════════════════════════
    // RENDER — Ledger Detail View
    // ════════════════════════════════════════════════════════
    if (ledgerData) {
        return (
            <div className="space-y-6">
                {/* Toast */}
                {toast && (
                    <div className="fixed top-4 right-4 z-50 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg animate-in fade-in slide-in-from-top-2">
                        {toast}
                    </div>
                )}

                {/* Back button */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => {
                            setLedgerData(null);
                            setSelectedCustomerId(null);
                            setFilterAutoMfs(false);
                        }}
                        className="flex items-center gap-2 text-sm font-bold text-primary hover:text-on-primary-container transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        {t("ledger.back")}
                    </button>
                    <button
                        onClick={() => setFilterAutoMfs((f) => !f)}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${filterAutoMfs
                            ? "bg-primary text-white"
                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">sync</span>
                        {t("autoMfs.filter")}
                    </button>
                </div>

                {/* Customer header */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-on-surface">
                                {ledgerData.customerName}
                            </h2>
                            <div className="mt-2 flex gap-6 text-sm text-on-surface-variant">
                                <span>
                                    {t("ledger.balance")}:{" "}
                                    <strong className="text-primary">
                                        ৳ {formatMoney(ledgerData.currentBalance)}
                                    </strong>
                                </span>
                                {ledgerData.creditLimit && (
                                    <span>
                                        {t("ledger.creditLimit")}:{" "}
                                        <strong>৳ {formatMoney(ledgerData.creditLimit)}</strong>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => openTxForm("BAKI", selectedCustomerId ?? undefined)}
                                className="bg-surface-container-highest text-on-surface-variant px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                {t("customerList.addBaki")}
                            </button>
                            <button
                                onClick={() => openTxForm("JOMA", selectedCustomerId ?? undefined)}
                                className="bg-primary text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                            >
                                <span className="material-symbols-outlined">payments</span>
                                {t("customerList.collectPayment")}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transaction History — card-based per due_ledger_workspace/code.html */}
                <div className="bg-surface-container-low rounded-2xl p-8 flex-1">
                    <h3 className="text-lg font-headline font-bold text-on-surface mb-6">{t("ledger.title")} <span className="text-sm font-normal text-on-surface-variant font-bengali ml-2">{t("ledger.subtitle")}</span></h3>
                    <div className="flex flex-col gap-4">
                        {filteredLedgerTransactions.length === 0 ? (
                            <p className="py-8 text-center text-sm text-on-surface-variant">{t("ledger.empty")}</p>
                        ) : (
                            filteredLedgerTransactions.map((tx: DueTransaction) => {
                                const isAutoMfs = tx.recordedVia === "AUTO_MFS";
                                const isJoma = tx.type === "JOMA";
                                return (
                                    <div key={tx.id} className={`rounded-xl p-5 relative overflow-hidden ${isAutoMfs ? "bg-primary-fixed/20 border-l-4 border-primary" : "bg-surface-container-lowest"}`}>
                                        {isAutoMfs && <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-primary-fixed/40 to-transparent pointer-events-none" />}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full ${isAutoMfs ? "bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm" : "bg-surface-container-low flex items-center justify-center text-on-surface-variant"}`}>
                                                    <span className="material-symbols-outlined" style={isAutoMfs ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                                                        {isJoma ? "account_balance_wallet" : "shopping_bag"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-headline font-semibold text-on-surface">
                                                        {isAutoMfs ? t("autoMfs.title") : (tx.description || tx.type)}
                                                        {isJoma && !isAutoMfs && <span className="text-on-surface-variant"> ({tx.type})</span>}
                                                    </h4>
                                                    <p className={`text-sm text-on-surface-variant mt-0.5 ${isAutoMfs ? "font-bengali" : ""}`}>
                                                        {isAutoMfs
                                                            ? `${tx.paymentMethod || "MFS"} ending · ${new Date(tx.date).toLocaleDateString(loc)}`
                                                            : new Date(tx.date).toLocaleDateString(loc)
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-headline font-bold text-lg ${isJoma ? "text-primary" : "text-error"}`}>
                                                    {isJoma ? "+" : "−"} ৳ {formatMoney(tx.amount)}
                                                </p>
                                                <p className="font-body text-xs text-on-surface-variant mt-0.5">
                                                    {isJoma ? t("ledger.paymentReceived") : t("ledger.creditAdded")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Transaction Form Overlay */}
                {showTxForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                        <form
                            onSubmit={handleTxSubmit}
                            className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-2xl space-y-4"
                        >
                            <h3 className="text-lg font-bold text-on-surface">{t("transactionForm.title")}</h3>

                            {/* Customer (pre-selected, readonly) */}
                            <div>
                                <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                    {t("transactionForm.selectCustomer")}
                                </label>
                                <select
                                    value={txForm.customerId}
                                    onChange={(e) => setTxForm((f) => ({ ...f, customerId: e.target.value }))}
                                    className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface"
                                    required
                                >
                                    <option value="">{t("transactionForm.selectCustomer")}</option>
                                    {allCustomers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.phone ? `(${c.phone})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Type */}
                            <div>
                                <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                    {t("transactionForm.type")}
                                </label>
                                <div className="flex gap-2">
                                    {(["BAKI", "JOMA", "ADJUSTMENT"] as DueTransactionType[]).map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setTxForm((f) => ({ ...f, type }))}
                                            className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${txForm.type === type
                                                ? "bg-primary text-white"
                                                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                                }`}
                                        >
                                            {t(`transactionForm.${type.toLowerCase()}` as "baki")}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                    {t("transactionForm.amount")}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={txForm.amount}
                                    onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))}
                                    className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                    {t("transactionForm.description")}
                                </label>
                                <input
                                    type="text"
                                    value={txForm.description}
                                    onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))}
                                    className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface"
                                    placeholder={t("transactionForm.descriptionPlaceholder")}
                                />
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                    {t("transactionForm.paymentMethod")}
                                </label>
                                <select
                                    value={txForm.paymentMethod}
                                    onChange={(e) => setTxForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                                    className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface"
                                >
                                    <option value="CASH">{t("transactionForm.cash")}</option>
                                    <option value="BKASH">{t("transactionForm.bkash")}</option>
                                    <option value="NAGAD">{t("transactionForm.nagad")}</option>
                                    <option value="ROCKET">{t("transactionForm.rocket")}</option>
                                    <option value="BANK_TRANSFER">{t("transactionForm.bankTransfer")}</option>
                                    <option value="OTHER">{t("transactionForm.other")}</option>
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTxForm(false)}
                                    className="flex-1 rounded-xl bg-surface-container px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                                >
                                    {t("transactionForm.cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? "…" : t("transactionForm.submit")}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    // ════════════════════════════════════════════════════════
    // RENDER — Main Due Ledger View
    // ════════════════════════════════════════════════════════
    return (
        <div className="space-y-8">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg animate-in fade-in slide-in-from-top-2">
                    {toast}
                </div>
            )}

            {/* ── Header with NLP bar ── */}
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={openCustomerForm}
                        className="bg-primary text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined">person_add</span>
                        {t("actions.newCustomer")}
                    </button>
                </div>
            </header>

            {/* ── NLP Voice/Text Input ── */}
            <div className="bg-surface-container rounded-full px-5 py-2.5 flex items-center gap-3 max-w-2xl">
                <span className="material-symbols-outlined text-on-surface-variant">auto_awesome</span>
                <input
                    type="text"
                    className="bg-transparent border-none focus:ring-0 text-sm flex-1 placeholder:text-on-surface-variant/60 outline-none"
                    placeholder={t("voice.placeholder")}
                />
                <button className="bg-primary text-white p-1.5 rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors">
                    <span className="material-symbols-outlined text-sm">send</span>
                </button>
            </div>

            {/* ── Stats Bento Grid ── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Due — 2 columns */}
                <div className="md:col-span-2 bg-surface-container-low p-8 rounded-2xl flex flex-col justify-between min-h-[200px]">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-on-surface-variant font-medium">{t("stats.totalDue")}</p>
                            <h3 className="text-4xl lg:text-5xl font-extrabold text-primary tracking-tighter whitespace-nowrap">
                                ৳ {formatMoney(totalDue)}
                            </h3>
                        </div>
                        <div className="bg-primary-container/10 p-4 rounded-full">
                            <span className="material-symbols-outlined text-primary text-4xl">
                                account_balance_wallet
                            </span>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-primary font-bold">
                        <span className="material-symbols-outlined">trending_up</span>
                        <span>{t("stats.customerCount")}: {customersWithDue.length}</span>
                    </div>
                </div>

                {/* Today's Recovery */}
                <div className="bg-surface-container-lowest shadow-sm p-8 rounded-2xl flex flex-col justify-between border-t-4 border-primary">
                    <div className="space-y-1">
                        <p className="text-on-surface-variant font-medium">{t("stats.todayRecovery")}</p>
                        <h3 className="text-4xl font-bold text-secondary tracking-tight">
                            ৳ {formatMoney(todayRecovery)}
                        </h3>
                    </div>
                    <div className="mt-6 flex flex-col gap-3">
                        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-secondary h-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (todayRecovery / (totalDue || 1)) * 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium">
                            {t("stats.overdueCount")}: {overdueCount}
                        </p>
                    </div>
                </div>
            </section>

            {/* ── AI Alert Widget (Glassmorphism) ── */}
            {overdueCount > 0 && (
                <section className="bg-surface-container/60 backdrop-blur-xl p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 opacity-10">
                        <span className="material-symbols-outlined text-[12rem]">auto_awesome</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-tertiary">warning</span>
                            <h4 className="text-lg font-bold text-tertiary">{t("alert.title")}</h4>
                        </div>
                        <p className="text-on-surface-variant mb-6 max-w-2xl leading-relaxed">
                            {overdueCount} {t("alert.description")}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleBulkReminders}
                                className="bg-primary text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                            >
                                <span className="material-symbols-outlined">smart_toy</span>
                                {t("alert.aiReminder")}
                            </button>
                            <button
                                onClick={() => setFilterPriority("urgent")}
                                className="bg-surface-container-highest text-on-surface px-6 py-3 rounded-full font-bold hover:bg-surface-container transition-colors"
                            >
                                {t("alert.viewList")}
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Customer Due List ── */}
            <section className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h4 className="text-2xl font-bold text-primary">{t("customerList.title")}</h4>
                        <p className="text-on-surface-variant">{t("customerList.subtitle")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="flex items-center gap-2 rounded-full bg-surface-container px-4 py-2">
                            <span className="material-symbols-outlined text-on-surface-variant text-lg">
                                search
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm w-32 xl:w-48 outline-none"
                                placeholder={t("transactionForm.searchCustomer")}
                            />
                        </div>
                        {/* Filter chips */}
                        <div className="flex gap-1">
                            {(["all", "urgent", "regular", "new"] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilterPriority(f)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${filterPriority === f
                                        ? "bg-primary text-white"
                                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                        }`}
                                >
                                    {t(`filter.${f}`)}
                                </button>
                            ))}
                            <button
                                onClick={() => setFilterAutoMfs((f) => !f)}
                                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${filterAutoMfs
                                    ? "bg-blue-600 text-white"
                                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-xs">sync</span>
                                {t("autoMfs.filter")}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Customer cards */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <span className="material-symbols-outlined animate-spin text-primary">
                                progress_activity
                            </span>
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl bg-error-container p-6 text-center text-on-error-container">
                            {error}
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="rounded-2xl bg-surface-container-lowest p-12 text-center text-on-surface-variant">
                            No customers with outstanding dues.
                        </div>
                    ) : (
                        filteredCustomers.map((customer) => {
                            const priority = getCustomerPriority(customer);
                            const days = daysSincePayment(customer.lastPaymentDate);
                            const reminderDays = daysSincePayment(customer.lastReminderSentAt ?? null);

                            return (
                                <div
                                    key={customer.customerId}
                                    className="bg-surface-container-lowest p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:shadow-md transition-shadow group"
                                >
                                    {/* Left: Avatar + Info */}
                                    <div
                                        className="flex items-center gap-4 flex-1 cursor-pointer"
                                        onClick={() => loadLedger(customer.customerId)}
                                    >
                                        <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xl font-bold shrink-0">
                                            {customer.customerName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h5 className="text-xl font-bold text-on-surface">
                                                    {customer.customerName}
                                                </h5>
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${priorityBadge(priority)}`}
                                                >
                                                    {priorityLabel(priority)}
                                                </span>
                                            </div>
                                            <p className="text-on-surface-variant text-sm flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">schedule</span>
                                                {t("customerList.lastPayment")}{" "}
                                                {days === null
                                                    ? t("customerList.never")
                                                    : `${days} ${t("customerList.daysAgo")}`}
                                            </p>
                                            {reminderDays !== null && (
                                                <p className="text-on-surface-variant text-xs flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">mark_chat_read</span>
                                                    {t("customerList.lastReminder")}{" "}
                                                    {reminderDays === 0
                                                        ? t("customerList.today")
                                                        : `${reminderDays} ${t("customerList.daysAgo")}`}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle: Due amount */}
                                    <div className="flex flex-col md:items-end flex-1">
                                        <p className="text-sm text-on-surface-variant font-medium">
                                            {t("customerList.totalDue")}
                                        </p>
                                        <p
                                            className={`text-2xl font-black tracking-tight ${dueAmountColor(priority)}`}
                                        >
                                            ৳ {formatMoney(customer.currentBalance)}
                                        </p>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button
                                            onClick={() => openTxForm("BAKI", customer.customerId)}
                                            className="flex-1 md:flex-none bg-surface-container-highest text-on-surface-variant px-5 py-4 rounded-xl font-bold flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined">add_circle</span>
                                            {t("customerList.addBaki")}
                                        </button>
                                        <button
                                            onClick={() => openTxForm("JOMA", customer.customerId)}
                                            className="flex-1 md:flex-none bg-primary text-white px-5 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                                        >
                                            <span className="material-symbols-outlined">payments</span>
                                            {t("customerList.collectPayment")}
                                        </button>
                                        <button
                                            onClick={() => handleOpenReminder(customer.customerId)}
                                            className="bg-[#25D366] text-white p-4 rounded-xl flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all"
                                            title={t("customerList.whatsappReminder")}
                                        >
                                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.628 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* ── Transaction Form Overlay ── */}
            {showTxForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <form
                        onSubmit={handleTxSubmit}
                        className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-2xl space-y-4"
                    >
                        <h3 className="text-lg font-bold text-on-surface">{t("transactionForm.title")}</h3>

                        {/* Customer */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                {t("transactionForm.selectCustomer")}
                            </label>
                            <select
                                value={txForm.customerId}
                                onChange={(e) => setTxForm((f) => ({ ...f, customerId: e.target.value }))}
                                className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface"
                                required
                            >
                                <option value="">{t("transactionForm.selectCustomer")}</option>
                                {allCustomers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.phone ? `(${c.phone})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                {t("transactionForm.type")}
                            </label>
                            <div className="flex gap-2">
                                {(["BAKI", "JOMA", "ADJUSTMENT"] as DueTransactionType[]).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setTxForm((f) => ({ ...f, type }))}
                                        className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${txForm.type === type
                                            ? "bg-primary text-white"
                                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                            }`}
                                    >
                                        {t(`transactionForm.${type.toLowerCase()}` as "baki")}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                {t("transactionForm.amount")}
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={txForm.amount}
                                onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))}
                                className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                {t("transactionForm.description")}
                            </label>
                            <input
                                type="text"
                                value={txForm.description}
                                onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))}
                                className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface"
                                placeholder={t("transactionForm.descriptionPlaceholder")}
                            />
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                {t("transactionForm.paymentMethod")}
                            </label>
                            <select
                                value={txForm.paymentMethod}
                                onChange={(e) => setTxForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                                className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface"
                            >
                                <option value="CASH">{t("transactionForm.cash")}</option>
                                <option value="BKASH">{t("transactionForm.bkash")}</option>
                                <option value="NAGAD">{t("transactionForm.nagad")}</option>
                                <option value="ROCKET">{t("transactionForm.rocket")}</option>
                                <option value="BANK_TRANSFER">{t("transactionForm.bankTransfer")}</option>
                                <option value="OTHER">{t("transactionForm.other")}</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowTxForm(false)}
                                className="flex-1 rounded-xl bg-surface-container px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                            >
                                {t("transactionForm.cancel")}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? "…" : t("transactionForm.submit")}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── New Customer Form Overlay ── */}
            {showCustomerForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <form
                        onSubmit={handleCustomerSubmit}
                        className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-2xl space-y-4"
                    >
                        <h3 className="text-lg font-bold text-on-surface">{t("customerForm.title")}</h3>

                        {/* Name */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                {t("customerForm.name")}
                            </label>
                            <input
                                type="text"
                                value={custForm.name}
                                onChange={(e) => setCustForm((f) => ({ ...f, name: e.target.value }))}
                                className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface"
                                placeholder={t("customerForm.namePlaceholder")}
                                required
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                {t("customerForm.phone")}
                            </label>
                            <input
                                type="tel"
                                value={custForm.phone}
                                onChange={(e) => setCustForm((f) => ({ ...f, phone: e.target.value }))}
                                className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface"
                                placeholder={t("customerForm.phonePlaceholder")}
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                {t("customerForm.address")}
                            </label>
                            <input
                                type="text"
                                value={custForm.address}
                                onChange={(e) => setCustForm((f) => ({ ...f, address: e.target.value }))}
                                className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface"
                                placeholder={t("customerForm.addressPlaceholder")}
                            />
                        </div>

                        {/* Credit Limit */}
                        <div>
                            <label className="mb-1 block text-xs font-bold text-on-surface-variant">
                                {t("customerForm.creditLimit")}
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={custForm.creditLimit}
                                onChange={(e) => setCustForm((f) => ({ ...f, creditLimit: e.target.value }))}
                                className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface"
                                placeholder={t("customerForm.creditLimitPlaceholder")}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowCustomerForm(false)}
                                className="flex-1 rounded-xl bg-surface-container px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                            >
                                {t("customerForm.cancel")}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? "…" : t("customerForm.submit")}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Reminder Preview Modal ── */}
            {reminderCustomer && (
                <ReminderPreviewModal
                    businessId={businessId}
                    customer={reminderCustomer}
                    onClose={() => setReminderCustomer(null)}
                    onSent={handleReminderSent}
                />
            )}
        </div>
    );
}
