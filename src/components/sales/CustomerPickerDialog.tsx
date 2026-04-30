"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { CustomerResponse } from "@/types/due";
import { listCustomers, createCustomer } from "@/lib/dueApi";

interface CustomerPickerDialogProps {
    businessId: string;
    open: boolean;
    onClose: () => void;
    onSelect: (customer: CustomerResponse) => void;
}

export default function CustomerPickerDialog({
    businessId,
    open,
    onClose,
    onSelect,
}: CustomerPickerDialogProps) {
    const t = useTranslations("shop.sales");
    const [customers, setCustomers] = useState<CustomerResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newAddress, setNewAddress] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchCustomers = useCallback(async (searchQuery?: string) => {
        setLoading(true);
        setFetchError(null);
        try {
            const params: { page: number; size: number; search?: string } = { page: 0, size: 50 };
            if (searchQuery && searchQuery.trim()) {
                params.search = searchQuery.trim();
            }
            const res = await listCustomers(businessId, params);
            setCustomers(res.content ?? []);
        } catch (err) {
            console.error("[CustomerPicker] Failed to fetch customers:", err);
            setCustomers([]);
            setFetchError(t("customer.loadError"));
        } finally {
            setLoading(false);
        }
    }, [businessId, t]);

    useEffect(() => {
        if (open) {
            fetchCustomers();
            setSearch("");
            setShowCreate(false);
            setNewName("");
            setNewPhone("");
            setNewAddress("");
            setError(null);
            setFetchError(null);
        }
    }, [open, fetchCustomers]);

    if (!open) return null;

    const filtered = customers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search))
    );

    async function handleCreate() {
        if (!newName.trim() || !newPhone.trim()) return;
        setCreating(true);
        setError(null);
        try {
            const created = await createCustomer(businessId, {
                name: newName.trim(),
                phone: newPhone.trim(),
                address: newAddress.trim() || undefined,
            });
            onSelect(created);
        } catch {
            setError(t("customer.createError"));
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-primary">
                        <span className="material-symbols-outlined mr-1 align-middle text-xl">person_add</span>
                        {t("customer.selectTitle")}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-on-surface-variant hover:text-on-surface"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {!showCreate ? (
                    <>
                        {/* Search */}
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("customer.searchPlaceholder")}
                            className="mb-3 w-full rounded-lg border border-surface-container-low bg-surface-container-lowest px-3 py-2 text-sm outline-none focus:border-primary"
                        />

                        {/* Fetch error with retry */}
                        {fetchError && (
                            <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                <span>{fetchError}</span>
                                <button
                                    type="button"
                                    onClick={() => fetchCustomers(search)}
                                    className="ml-auto shrink-0 rounded bg-rose-100 px-2 py-1 text-[10px] font-medium hover:bg-rose-200"
                                >
                                    {t("customer.retry")}
                                </button>
                            </div>
                        )}

                        {/* Customer list */}
                        <div className="max-h-64 space-y-1.5 overflow-y-auto">
                            {loading ? (
                                <p className="py-4 text-center text-sm text-on-surface-variant">
                                    {t("customer.loading")}
                                </p>
                            ) : fetchError ? null : filtered.length === 0 ? (
                                <p className="py-4 text-center text-sm text-on-surface-variant">
                                    {t("customer.noCustomers")}
                                </p>
                            ) : (
                                filtered.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => onSelect(c)}
                                        className="flex w-full items-center gap-3 rounded-lg bg-surface-container-lowest px-3 py-2.5 text-left transition-colors hover:bg-primary/10"
                                    >
                                        <span className="material-symbols-outlined text-on-surface-variant">person</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-on-surface">{c.name}</p>
                                            {c.phone && (
                                                <p className="text-[11px] text-on-surface-variant">{c.phone}</p>
                                            )}
                                        </div>
                                        {c.runningBalance > 0 && (
                                            <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                                ৳{c.runningBalance.toLocaleString()} {t("customer.due")}
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Create new */}
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/40 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                        >
                            <span className="material-symbols-outlined text-base">add</span>
                            {t("customer.createNew")}
                        </button>
                    </>
                ) : (
                    /* Create new customer form */
                    <div className="space-y-3">
                        {error && (
                            <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
                        )}
                        <div>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={t("customer.namePlaceholder")}
                                className="w-full rounded-lg border border-surface-container-low bg-surface-container-lowest px-3 py-2 text-sm outline-none focus:border-primary"
                                autoFocus
                            />
                        </div>
                        <div>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    placeholder={t("customer.whatsappPlaceholder")}
                                    className="w-full rounded-lg border border-surface-container-low bg-surface-container-lowest pl-10 pr-3 py-2 text-sm outline-none focus:border-primary"
                                />
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-green-600">chat</span>
                            </div>
                            <p className="mt-1 text-[10px] text-on-surface-variant">
                                {t("customer.whatsappHint")}
                            </p>
                        </div>
                        <div>
                            <input
                                type="text"
                                value={newAddress}
                                onChange={(e) => setNewAddress(e.target.value)}
                                placeholder={t("customer.addressPlaceholder")}
                                className="w-full rounded-lg border border-surface-container-low bg-surface-container-lowest px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className="flex-1 rounded-lg border border-surface-container-low py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
                            >
                                {t("customer.back")}
                            </button>
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={creating || !newName.trim() || !newPhone.trim()}
                                className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                            >
                                {creating ? t("customer.creating") : t("customer.createBtn")}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}