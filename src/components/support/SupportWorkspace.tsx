"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import type {
    SupportTicket,
    TicketCategory,
    TicketPriority,
    TicketStatus,
} from "@/types/support";
import { listTickets, createTicket, getTicket, addTicketMessage, closeTicket, reopenTicket } from "@/lib/supportApi";

function resolveLocale(locale?: string): string {
    return locale?.toLowerCase().startsWith("bn") ? "bn-BD" : "en-US";
}

// ─── Status badge colors ─────────────────────────────────

const STATUS_CLASSES: Record<TicketStatus, string> = {
    OPEN: "bg-primary-container text-on-primary-container",
    IN_PROGRESS: "bg-secondary-container text-on-secondary-container",
    WAITING_USER: "bg-tertiary-container text-on-tertiary-container",
    RESOLVED: "bg-surface-container-high text-on-surface-variant",
    CLOSED: "bg-surface-container text-on-surface-variant",
};

const PRIORITY_CLASSES: Record<TicketPriority, string> = {
    LOW: "bg-surface-container text-on-surface-variant",
    NORMAL: "bg-primary-container/50 text-on-primary-container",
    MEDIUM: "bg-secondary-container/50 text-on-secondary-container",
    HIGH: "bg-tertiary-container text-on-tertiary-container",
    URGENT: "bg-error-container text-on-error-container",
};

// ─── Component ───────────────────────────────────────────

export default function SupportWorkspace() {
    const t = useTranslations("support");
    const locale = useLocale();
    const loc = resolveLocale(locale);

    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Load tickets
    const loadTickets = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await listTickets(
                statusFilter === "ALL" ? undefined : statusFilter,
            );
            setTickets(response.content);
        } catch {
            setError(t("messages.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, t]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // Create ticket
    const handleCreate = useCallback(
        async (data: { subject: string; body: string; category: TicketCategory; priority: TicketPriority }) => {
            try {
                await createTicket(data);
                setShowCreateForm(false);
                loadTickets();
            } catch {
                setError(t("messages.createError"));
            }
        },
        [loadTickets, t],
    );

    // Select ticket
    const handleSelectTicket = useCallback(async (ticketId: string) => {
        try {
            const ticket = await getTicket(ticketId);
            setSelectedTicket(ticket);
        } catch {
            setError(t("messages.loadError"));
        }
    }, [t]);

    // Add reply
    const handleReply = useCallback(
        async (ticketId: string, message: string) => {
            try {
                const updated = await addTicketMessage(ticketId, message);
                setSelectedTicket(updated);
            } catch {
                setError(t("messages.replyError"));
            }
        },
        [t],
    );

    // Close ticket
    const handleClose = useCallback(
        async (ticketId: string) => {
            try {
                const updated = await closeTicket(ticketId);
                setSelectedTicket(updated);
                loadTickets();
            } catch {
                setError(t("messages.closeError"));
            }
        },
        [loadTickets, t],
    );

    // Reopen ticket
    const handleReopen = useCallback(
        async (ticketId: string) => {
            try {
                const updated = await reopenTicket(ticketId);
                setSelectedTicket(updated);
                loadTickets();
            } catch {
                setError(t("messages.reopenError"));
            }
        },
        [loadTickets, t],
    );

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-container transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    {t("create.title")}
                </button>
            </header>

            {/* ── Error ── */}
            {error && (
                <div className="rounded-2xl bg-error-container p-4 text-on-error-container text-sm">{error}</div>
            )}

            {/* ── Create Form Overlay ── */}
            {showCreateForm && (
                <CreateTicketForm
                    onSubmit={handleCreate}
                    onCancel={() => setShowCreateForm(false)}
                    t={t}
                />
            )}

            {/* ── Ticket Detail View ── */}
            {selectedTicket ? (
                <TicketDetail
                    ticket={selectedTicket}
                    onReply={handleReply}
                    onClose={handleClose}
                    onReopen={handleReopen}
                    onBack={() => setSelectedTicket(null)}
                    t={t}
                    loc={loc}
                />
            ) : (
                <>
                    {/* ── Status Filter ── */}
                    <div className="flex gap-2 overflow-x-auto">
                        {(["ALL", "OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"] as const).map(
                            (status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition-colors ${statusFilter === status
                                            ? "bg-primary text-white"
                                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                        }`}
                                >
                                    {t(`status.${status}`)}
                                </button>
                            ),
                        )}
                    </div>

                    {/* ── Ticket List ── */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <span className="material-symbols-outlined animate-spin text-primary text-3xl">
                                progress_activity
                            </span>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="rounded-[24px] bg-surface-container-lowest p-12 text-center shadow-sm">
                            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 block">
                                confirmation_number
                            </span>
                            <p className="text-on-surface-variant">{t("messages.noTickets")}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map((ticket) => (
                                <button
                                    key={ticket.id}
                                    onClick={() => handleSelectTicket(ticket.id)}
                                    className="w-full text-left rounded-[20px] bg-surface-container-lowest p-5 shadow-sm hover:bg-surface-container-low transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-on-surface truncate">{ticket.subject}</p>
                                            <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                                                {ticket.body}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLASSES[ticket.status]}`}>
                                                {t(`status.${ticket.status}`)}
                                            </span>
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PRIORITY_CLASSES[ticket.priority]}`}>
                                                {t(`priority.${ticket.priority}`)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3 text-xs text-on-surface-variant">
                                        <span>{t(`category.${ticket.category}`)}</span>
                                        <span>•</span>
                                        <span>{new Date(ticket.createdAt).toLocaleDateString(loc)}</span>
                                        {ticket.messages && (
                                            <>
                                                <span>•</span>
                                                <span>{ticket.messages.length} {t("messages.messages")}</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// CREATE TICKET FORM
// ═══════════════════════════════════════════════════════════

function CreateTicketForm({
    onSubmit,
    onCancel,
    t,
}: {
    onSubmit: (data: { subject: string; body: string; category: TicketCategory; priority: TicketPriority }) => void;
    onCancel: () => void;
    t: (key: string) => string;
}) {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [category, setCategory] = useState<TicketCategory>("GENERAL");
    const [priority, setPriority] = useState<TicketPriority>("NORMAL");

    const categories: TicketCategory[] = [
        "GENERAL", "BILLING", "TECHNICAL", "CATEGORY_REQUEST", "FEATURE_REQUEST", "ACCOUNT", "OTHER",
    ];
    const priorities: TicketPriority[] = ["LOW", "NORMAL", "MEDIUM", "HIGH", "URGENT"];

    return (
        <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-primary">{t("create.title")}</h3>

            <label className="block">
                <span className="text-sm font-bold text-on-surface-variant">{t("create.subject")}</span>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder={t("create.subjectPlaceholder")}
                />
            </label>

            <label className="block">
                <span className="text-sm font-bold text-on-surface-variant">{t("create.body")}</span>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="mt-1 w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px]"
                    placeholder={t("create.bodyPlaceholder")}
                />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                    <span className="text-sm font-bold text-on-surface-variant">{t("create.category")}</span>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TicketCategory)}
                        className="mt-1 w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
                        ))}
                    </select>
                </label>

                <label className="block">
                    <span className="text-sm font-bold text-on-surface-variant">{t("create.priority")}</span>
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TicketPriority)}
                        className="mt-1 w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        {priorities.map((p) => (
                            <option key={p} value={p}>{t(`priority.${p}`)}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => onSubmit({ subject, body, category, priority })}
                    disabled={!subject.trim() || !body.trim()}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-container transition-colors disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-sm">send</span>
                    {t("create.submit")}
                </button>
                <button
                    onClick={onCancel}
                    className="rounded-xl bg-surface-container px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                    {t("create.cancel")}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// TICKET DETAIL VIEW
// ═══════════════════════════════════════════════════════════

function TicketDetail({
    ticket,
    onReply,
    onClose,
    onReopen,
    onBack,
    t,
    loc,
}: {
    ticket: SupportTicket;
    onReply: (ticketId: string, message: string) => Promise<void>;
    onClose: (ticketId: string) => Promise<void>;
    onReopen: (ticketId: string) => Promise<void>;
    onBack: () => void;
    t: (key: string) => string;
    loc: string;
}) {
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);

    const isOpen =
        ticket.status === "OPEN" ||
        ticket.status === "IN_PROGRESS" ||
        ticket.status === "WAITING_USER";

    const handleReply = async () => {
        if (!replyText.trim()) return;
        setIsSending(true);
        await onReply(ticket.id, replyText.trim());
        setReplyText("");
        setIsSending(false);
    };

    return (
        <div className="space-y-6">
            {/* Back button + actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    {t("detail.back")}
                </button>
                <div className="flex gap-2">
                    {isOpen && (
                        <button
                            onClick={() => onClose(ticket.id)}
                            className="flex items-center gap-2 rounded-xl bg-surface-container px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">check</span>
                            {t("detail.close")}
                        </button>
                    )}
                    {(ticket.status === "CLOSED" || ticket.status === "RESOLVED") && (
                        <button
                            onClick={() => onReopen(ticket.id)}
                            className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-white hover:bg-secondary-container transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">reopen</span>
                            {t("detail.reopen")}
                        </button>
                    )}
                </div>
            </div>

            {/* Ticket header */}
            <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-on-surface">{ticket.subject}</h2>
                        <p className="text-sm text-on-surface-variant mt-1">{ticket.body}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLASSES[ticket.status]}`}>
                            {t(`status.${ticket.status}`)}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PRIORITY_CLASSES[ticket.priority]}`}>
                            {t(`priority.${ticket.priority}`)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3 mt-4 text-xs text-on-surface-variant">
                    <span>{t(`category.${ticket.category}`)}</span>
                    <span>•</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString(loc)}</span>
                </div>
            </div>

            {/* Messages */}
            {ticket.messages && ticket.messages.length > 0 && (
                <div className="space-y-3">
                    {ticket.messages
                        .filter((msg) => !msg.isInternal)
                        .map((msg) => (
                            <div
                                key={msg.id}
                                className={`rounded-2xl px-4 py-3 ${msg.senderId === ticket.userId
                                        ? "ml-8 bg-primary/10 text-on-surface"
                                        : "mr-8 bg-surface-container-lowest text-on-surface shadow-sm"
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                <p className="text-xs text-on-surface-variant mt-2">
                                    {new Date(msg.createdAt).toLocaleString(loc)}
                                </p>
                            </div>
                        ))}
                </div>
            )}

            {/* Reply input */}
            {isOpen && (
                <div className="rounded-[20px] bg-surface-container-lowest p-4 shadow-sm">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={t("detail.replyPlaceholder")}
                            className="flex-1 rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) handleReply();
                            }}
                            disabled={isSending}
                        />
                        <button
                            onClick={handleReply}
                            disabled={!replyText.trim() || isSending}
                            className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-white hover:bg-primary-container transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined">
                                {isSending ? "progress_activity" : "send"}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
