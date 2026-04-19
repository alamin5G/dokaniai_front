"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import * as adminApi from "@/lib/adminApi";
import type { SupportTicket, TicketStatus, TicketPriority } from "@/types/support";
import type { AdminListTicketsParams, TicketResponseRequest, AssignTicketRequest } from "@/types/admin";
import { useAuthStore } from "@/store/authStore";

const PRIORITY_COLORS: Record<string, string> = {
    LOW: "bg-surface-container-highest text-on-surface",
    NORMAL: "bg-surface-container-highest text-on-surface",
    MEDIUM: "bg-secondary-fixed text-on-secondary-fixed",
    HIGH: "bg-error-container text-on-error-container",
    URGENT: "bg-error-container text-on-error-container",
};

const STATUS_COLORS: Record<string, string> = {
    OPEN: "bg-primary-fixed text-on-primary",
    IN_PROGRESS: "bg-secondary-container/30 text-secondary",
    WAITING_USER: "bg-surface-container-high text-on-surface-variant",
    RESOLVED: "bg-primary-fixed/50 text-primary",
    CLOSED: "bg-surface-container text-on-surface-variant",
};

const TIER_BADGES: Record<string, { bg: string; icon: string }> = {
    PLUS: { bg: "bg-primary-container text-on-primary", icon: "workspace_premium" },
    PRO: { bg: "bg-secondary-container/30 text-secondary", icon: "stars" },
    BASIC: { bg: "bg-surface-container-highest text-on-surface-variant", icon: "person" },
    FREE: { bg: "bg-surface-container text-on-surface-variant", icon: "person" },
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function AdminSupportPage() {
    const t = useTranslations("admin.support");
    const { userId } = useAuthStore();

    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");

    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);

    const loadTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params: AdminListTicketsParams = { page, size: 20 };
            if (statusFilter) params.status = statusFilter;
            const data = await adminApi.adminListTickets(params);
            setTickets(data.content);
            setTotalPages(data.totalPages);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [page, statusFilter]);

    useEffect(() => { loadTickets(); }, [loadTickets]);
    useEffect(() => { setPage(0); }, [statusFilter]);

    async function handleSelectTicket(ticket: SupportTicket) {
        setSelectedTicket(ticket);
        setReplyText("");
    }

    async function handleReply() {
        if (!selectedTicket || !replyText.trim()) return;
        setSending(true);
        try {
            const req: TicketResponseRequest = {
                message: replyText.trim(),
                isInternal: false,
                newStatus: selectedTicket.status === "OPEN" ? "IN_PROGRESS" : undefined,
            };
            await adminApi.respondToTicket(selectedTicket.id, req);
            setReplyText("");
            await loadTickets();
            const updated = tickets.find(t => t.id === selectedTicket.id);
            if (updated) setSelectedTicket({ ...updated });
        } catch { /* silent */ }
        finally { setSending(false); }
    }

    async function handleAssignToMe() {
        if (!selectedTicket || !userId) return;
        try {
            const req: AssignTicketRequest = { adminId: userId };
            await adminApi.assignTicket(selectedTicket.id, req);
            await loadTickets();
            setSelectedTicket({ ...selectedTicket, assignedAdminId: userId });
        } catch { /* silent */ }
    }

    async function handleResolve() {
        if (!selectedTicket) return;
        try {
            const req: TicketResponseRequest = {
                message: "Ticket resolved.",
                isInternal: false,
                newStatus: "RESOLVED" as TicketStatus,
            };
            await adminApi.respondToTicket(selectedTicket.id, req);
            await loadTickets();
            setSelectedTicket({ ...selectedTicket, status: "RESOLVED" as TicketStatus });
        } catch { /* silent */ }
    }

    async function handleEscalate() {
        if (!selectedTicket) return;
        try {
            await adminApi.escalateTicket(selectedTicket.id, { reason: "Manual escalation" });
            await loadTickets();
            setSelectedTicket({ ...selectedTicket, priority: "URGENT" as TicketPriority });
        } catch { /* silent */ }
    }

    const selectedMessages = selectedTicket?.messages || [];

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full h-[calc(100vh-10rem)]">
            <div className="space-y-1">
                <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">{t("title")}</h2>
                <p className="text-on-surface-variant text-sm">{t("subtitle")}</p>
                <p className="text-[10px] uppercase font-bold text-primary/50 tracking-widest mt-1">{t("tierNote")}</p>
            </div>

            <div className="flex gap-2">
                {["", "OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"].map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s as TicketStatus | "")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === s
                            ? "bg-primary-fixed text-on-primary"
                            : s === "OPEN" || s === "IN_PROGRESS"
                                ? "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                                : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"}`}>
                        {s ? t(`status.${s}`) : t("all")}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
                <div className="w-2/5 flex flex-col gap-3 overflow-y-auto pr-2">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-container-high border-t-primary" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-12 text-on-surface-variant">{t("noTickets")}</div>
                    ) : (
                        tickets.map((ticket) => {
                            const isSelected = selectedTicket?.id === ticket.id;
                            const priority = ticket.priority || "NORMAL";
                            const tier = (ticket as unknown as Record<string, string>).subscriptionTier || "BASIC";
                            const tierBadge = TIER_BADGES[tier] || TIER_BADGES.BASIC;
                            const assignedName = ticket.assignedAdminId ? ticket.assignedAdminId.slice(0, 4) : null;

                            return (
                                <div key={ticket.id}
                                    onClick={() => handleSelectTicket(ticket)}
                                    className={`p-5 rounded-xl cursor-pointer relative overflow-hidden transition-all ${isSelected
                                        ? "bg-surface-container-lowest shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-outline-variant/15"
                                        : "bg-surface-container-low hover:bg-surface-container-lowest group"}`}
                                >
                                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-headline font-bold text-lg leading-tight ${isSelected ? "text-on-surface" : "text-on-surface-variant group-hover:text-on-surface"}`}>
                                            {ticket.subject}
                                        </h3>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`${PRIORITY_COLORS[priority] || PRIORITY_COLORS.NORMAL} text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider`}>
                                                {t(`priority.${priority}`)}
                                            </span>
                                            <span className={`${tierBadge.bg} text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter flex items-center gap-1`}>
                                                <span className="material-symbols-outlined text-[12px]">{tierBadge.icon}</span>
                                                {tier}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-on-surface-variant text-xs flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">category</span>
                                                {t(`category.${ticket.category}`)}
                                            </span>
                                            <span className="text-on-surface-variant text-xs flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                {timeAgo(ticket.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {assignedName ? (
                                                <>
                                                    <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-bold text-on-surface-variant">
                                                        {assignedName}
                                                    </div>
                                                    <span className="text-xs font-medium text-on-surface-variant">{assignedName}</span>
                                                </>
                                            ) : (
                                                <span className="text-xs font-medium text-error">{t("unassigned")}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="w-3/5 bg-surface-container-lowest rounded-2xl flex flex-col relative overflow-hidden ring-1 ring-outline-variant/15">
                    {!selectedTicket ? (
                        <div className="flex-1 flex items-center justify-center text-on-surface-variant">
                            {t("selectTicket")}
                        </div>
                    ) : (
                        <>
                            <div className="p-6 pb-4 bg-surface-container-low/50 border-b border-outline-variant/10">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-3 items-center">
                                        <span className={`${STATUS_COLORS[selectedTicket.status] || STATUS_COLORS.OPEN} text-xs px-3 py-1.5 rounded-md font-bold uppercase tracking-wider`}>
                                            {t(`status.${selectedTicket.status}`)}
                                        </span>
                                        <span className="text-on-surface-variant text-sm font-medium">
                                            {selectedTicket.id.slice(0, 8)}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {!selectedTicket.assignedAdminId && (
                                            <button onClick={handleAssignToMe}
                                                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                                                {t("assignToMe")}
                                            </button>
                                        )}
                                        {selectedTicket.status !== "RESOLVED" && selectedTicket.status !== "CLOSED" && (
                                            <>
                                                <button onClick={handleEscalate}
                                                    className="px-3 py-1.5 rounded-lg bg-error-container/30 text-error text-xs font-bold hover:bg-error-container/50 transition-colors">
                                                    {t("escalate")}
                                                </button>
                                                <button onClick={handleResolve}
                                                    className="px-3 py-1.5 rounded-lg bg-primary-fixed/50 text-primary text-xs font-bold hover:bg-primary-fixed/70 transition-colors">
                                                    {t("resolve")}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <h2 className="text-2xl font-headline font-bold text-on-surface">{selectedTicket.subject}</h2>
                                <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">{selectedTicket.body}</p>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                                {selectedMessages.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
                                        {t("noMessages")}
                                    </div>
                                ) : (
                                    selectedMessages.map((msg) => (
                                        <div key={msg.id} className={`flex gap-3 ${msg.isInternal ? "justify-center" : ""}`}>
                                            {msg.isInternal ? (
                                                <span className="bg-surface-container-low text-on-surface-variant text-xs px-4 py-2 rounded-full font-medium flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[14px]">info</span>
                                                    {msg.message}
                                                </span>
                                            ) : (
                                                <>
                                                    <div className="w-8 h-8 rounded-full bg-surface-container-highest flex-shrink-0 flex items-center justify-center text-on-surface-variant font-bold text-xs mt-1">
                                                        {msg.senderId.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col gap-1 max-w-[80%]">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="font-bold text-sm text-on-surface">{msg.senderId.slice(0, 8)}</span>
                                                            <span className="text-xs text-on-surface-variant">{timeAgo(msg.createdAt)}</span>
                                                        </div>
                                                        <div className="bg-surface-container-low p-4 rounded-2xl rounded-tl-none text-on-surface text-sm leading-relaxed">
                                                            {msg.message}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-surface/80 backdrop-blur-xl border-t border-outline-variant/10">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                            {t("reply")}
                                        </span>
                                    </div>
                                    <div className="relative bg-surface-container-lowest rounded-xl ring-1 ring-outline-variant/20 focus-within:ring-primary/30 transition-all overflow-hidden flex items-end p-2">
                                        <textarea
                                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-on-surface resize-none p-2"
                                            placeholder={t("replyPlaceholder")}
                                            rows={2}
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                        />
                                        <div className="flex gap-2 p-2">
                                            <button
                                                onClick={handleReply}
                                                disabled={sending || !replyText.trim()}
                                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-medium text-sm hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {t("send")} <span className="material-symbols-outlined text-[18px]">send</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50">
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <span className="text-sm text-on-surface px-4">{page + 1} / {totalPages}</span>
                        <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50">
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
