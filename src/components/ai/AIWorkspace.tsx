"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
    AIResponse,
    AIMessage,
    ConversationSummary,
    ParsedAction,
    VoiceSessionResponse,
    AIUsageStats,
    AIActionType,
} from "@/types/ai";
import {
    sendChatMessage,
    getConversations,
    getConversation,
    deleteConversation,
    parseAndExecute,
    getAIUsageStats,
    createVoiceSession,
    transcribeVoiceSession,
    updateVoiceDraft,
    confirmVoiceDraft,
    parseVoicePreview,
    executeVoiceLowRisk,
} from "@/lib/aiApi";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import UpgradeCta from "../reports/UpgradeCta";

type TabKey = "chat" | "voice" | "commands";

// ─── Action type color/icon mapping ─────────────────────

const ACTION_META: Record<AIActionType, { icon: string; color: string }> = {
    SALE: { icon: "receipt_long", color: "text-primary" },
    EXPENSE: { icon: "payments", color: "text-error" },
    DUE_BAKI: { icon: "menu_book", color: "text-tertiary" },
    DUE_JOMA: { icon: "savings", color: "text-secondary" },
    DISCOUNT: { icon: "sell", color: "text-primary" },
    RETURN: { icon: "undo", color: "text-tertiary" },
    QUERY: { icon: "help", color: "text-on-surface-variant" },
    UNKNOWN: { icon: "question_mark", color: "text-on-surface-variant" },
};

// ─── Component ───────────────────────────────────────────

export default function AIWorkspace({ businessId }: { businessId: string }) {
    const t = useTranslations("shop.ai");
    const plan = usePlanFeatures();

    const [activeTab, setActiveTab] = useState<TabKey>("chat");

    // ── Usage stats ──
    const [usage, setUsage] = useState<AIUsageStats | null>(null);

    useEffect(() => {
        getAIUsageStats().then(setUsage).catch(() => { });
    }, []);

    const tabs: { key: TabKey; icon: string }[] = [
        { key: "chat", icon: "chat" },
        { key: "voice", icon: "mic" },
        { key: "commands", icon: "terminal" },
    ];

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary tracking-tight">{t("title")}</h1>
                    <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
                </div>
                {/* Usage badge */}
                {usage && (
                    <div className="flex items-center gap-3 rounded-2xl bg-surface-container px-4 py-2.5">
                        <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                        <span className="text-sm font-bold text-on-surface">
                            {t("usage.queries", {
                                used: usage.queriesToday,
                                limit: usage.queriesLimit > 0 ? usage.queriesLimit : "∞",
                            })}
                        </span>
                        {usage.queriesLimit > 0 && (
                            <div className="w-20 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{
                                        width: `${Math.min(100, (usage.queriesToday / usage.queriesLimit) * 100)}%`,
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* ── Tab Navigation ── */}
            <div className="flex gap-1 overflow-x-auto rounded-2xl bg-surface-container p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === tab.key
                            ? "bg-surface-container-lowest text-primary shadow-sm"
                            : "text-on-surface-variant hover:bg-surface-container-low"
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        {t(`tabs.${tab.key}`)}
                        {tab.key === "voice" && !plan.voice && (
                            <span className="material-symbols-outlined text-xs text-tertiary">lock</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            {activeTab === "chat" && (
                <ChatTab businessId={businessId} />
            )}
            {activeTab === "voice" && (
                plan.voice ? (
                    <VoiceTab businessId={businessId} />
                ) : (
                    <UpgradeCta feature="aiInsights" />
                )
            )}
            {activeTab === "commands" && (
                <CommandsTab businessId={businessId} />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// CHAT TAB
// ═══════════════════════════════════════════════════════════

function ChatTab({ businessId }: { businessId: string }) {
    const t = useTranslations("shop.ai");
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load conversations
    useEffect(() => {
        getConversations(0, 20).then((res) => setConversations(res.content)).catch(() => { });
    }, []);

    // Load active conversation messages
    useEffect(() => {
        if (activeConvId) {
            getConversation(activeConvId).then((res) => setMessages(res.messages)).catch(() => { });
        }
    }, [activeConvId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isSending) return;
        const userMessage = input.trim();
        setInput("");
        setIsSending(true);

        // Add optimistic user message
        const optimisticUser: AIMessage = {
            id: `temp-${Date.now()}`,
            conversationId: activeConvId ?? "",
            role: "USER",
            content: userMessage,
            actionType: null,
            structuredOutput: null,
            confidenceScore: null,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticUser]);

        try {
            const response = await sendChatMessage({
                businessId,
                conversationId: activeConvId ?? undefined,
                message: userMessage,
            });

            // Set conversation ID from response
            if (!activeConvId && response.conversationId) {
                setActiveConvId(response.conversationId);
            }

            // Add AI response
            const aiMessage: AIMessage = {
                id: response.messageId,
                conversationId: response.conversationId,
                role: "ASSISTANT",
                content: response.content,
                actionType: response.actionType,
                structuredOutput: response.structuredOutput,
                confidenceScore: response.confidenceScore,
                createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `error-${Date.now()}`,
                    conversationId: activeConvId ?? "",
                    role: "ASSISTANT",
                    content: t("chat.error"),
                    actionType: null,
                    structuredOutput: null,
                    confidenceScore: null,
                    createdAt: new Date().toISOString(),
                },
            ]);
        } finally {
            setIsSending(false);
        }
    }, [input, isSending, businessId, activeConvId, t]);

    const handleNewChat = useCallback(() => {
        setActiveConvId(null);
        setMessages([]);
    }, []);

    const handleDeleteConversation = useCallback(
        async (convId: string) => {
            try {
                await deleteConversation(convId);
                setConversations((prev) => prev.filter((c) => c.id !== convId));
                if (activeConvId === convId) {
                    handleNewChat();
                }
            } catch {
                // silent
            }
        },
        [activeConvId, handleNewChat],
    );

    return (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Sidebar: Conversation History */}
            <aside className={`space-y-3 ${showHistory ? "block" : "hidden lg:block"}`}>
                <button
                    onClick={handleNewChat}
                    className="flex w-full items-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white hover:bg-primary-container transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    {t("chat.newChat")}
                </button>

                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors ${activeConvId === conv.id
                                ? "bg-primary-container/20 text-primary font-bold"
                                : "text-on-surface-variant hover:bg-surface-container-low"
                                }`}
                            onClick={() => setActiveConvId(conv.id)}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="truncate">{conv.title}</p>
                                <p className="text-xs text-on-surface-variant truncate">
                                    {conv.lastMessage}
                                </p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteConversation(conv.id);
                                }}
                                className="ml-2 text-on-surface-variant hover:text-error"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Chat Area */}
            <div className="flex flex-col rounded-[24px] bg-surface-container-lowest shadow-sm overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[400px] max-h-[600px]">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
                            <span className="material-symbols-outlined text-5xl mb-4 text-primary/30">auto_awesome</span>
                            <p className="text-lg font-bold">{t("chat.welcome")}</p>
                            <p className="text-sm mt-2">{t("chat.welcomeHint")}</p>
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "USER"
                                    ? "bg-primary text-white rounded-br-md"
                                    : "bg-surface-container text-on-surface rounded-bl-md"
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                {msg.actionType && msg.actionType !== "UNKNOWN" && msg.actionType !== "QUERY" && (
                                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5">
                                        <span className={`material-symbols-outlined text-sm ${ACTION_META[msg.actionType].color}`}>
                                            {ACTION_META[msg.actionType].icon}
                                        </span>
                                        <span className="text-xs font-bold text-on-surface-variant">
                                            {t(`actions.${msg.actionType}`)}
                                        </span>
                                        {msg.confidenceScore != null && (
                                            <span className="text-xs text-on-surface-variant">
                                                ({(msg.confidenceScore * 100).toFixed(0)}%)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Query Buttons */}
                <div className="border-t border-surface-container px-4 pt-3">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {[
                            { key: "QQ-01", bn: "আজকের বিক্রয় কত?", en: "Today's sales?" },
                            { key: "QQ-02", bn: "এই মাসের লাভ কত?", en: "Month's profit?" },
                            { key: "QQ-03", bn: "কোন পণ্য কম আছে?", en: "Low stock?" },
                            { key: "QQ-04", bn: "কার কত বাকি?", en: "Who owes?" },
                            { key: "QQ-05", bn: "সেরা বিক্রিত পণ্য?", en: "Best seller?" },
                            { key: "QQ-06", bn: "গত সপ্তাহের খরচ?", en: "Last week expense?" },
                            { key: "QQ-07", bn: "স্টক রিঅর্ডার কোনগুলো?", en: "Reorder items?" },
                            { key: "QQ-08", bn: "আজকের ডিসকাউন্ট কত?", en: "Today discounts?" },
                        ].map((qq) => (
                            <button
                                key={qq.key}
                                onClick={() => {
                                    setInput(qq.bn);
                                }}
                                className="whitespace-nowrap rounded-full bg-primary-container/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-container transition-colors"
                            >
                                {qq.bn}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input */}
                <div className="px-4 pb-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex items-center gap-3"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t("chat.placeholder")}
                            className="flex-1 rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30"
                            disabled={isSending}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isSending}
                            className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-white hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined">
                                {isSending ? "progress_activity" : "send"}
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// VOICE TAB
// ═══════════════════════════════════════════════════════════

function VoiceTab({ businessId }: { businessId: string }) {
    const t = useTranslations("shop.ai");
    const [session, setSession] = useState<VoiceSessionResponse | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [parsedAction, setParsedAction] = useState<ParsedAction | null>(null);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });

                setIsProcessing(true);
                setError(null);
                try {
                    // Create session if needed
                    let currentSession = session;
                    if (!currentSession) {
                        currentSession = await createVoiceSession({ businessId });
                        setSession(currentSession);
                    }

                    // Transcribe
                    const updated = await transcribeVoiceSession(currentSession.sessionId, blob);
                    setSession(updated);
                } catch {
                    setError(t("voice.transcribeError"));
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
        } catch {
            setError(t("voice.micError"));
        }
    }, [businessId, session, t]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    // Edit draft
    const handleDraftEdit = useCallback(
        async (newText: string) => {
            if (!session) return;
            try {
                const updated = await updateVoiceDraft(session.sessionId, { draftText: newText });
                setSession(updated);
            } catch {
                setError(t("voice.updateError"));
            }
        },
        [session, t],
    );

    // Confirm draft
    const handleConfirm = useCallback(async () => {
        if (!session) return;
        setIsProcessing(true);
        try {
            const updated = await confirmVoiceDraft(session.sessionId);
            setSession(updated);
        } catch {
            setError(t("voice.confirmError"));
        } finally {
            setIsProcessing(false);
        }
    }, [session, t]);

    // Parse preview
    const handleParsePreview = useCallback(async () => {
        if (!session?.confirmationToken) return;
        setIsProcessing(true);
        try {
            const preview = await parseVoicePreview(session.sessionId, {
                confirmationToken: session.confirmationToken,
            });
            setParsedAction(preview.parsedAction);
        } catch {
            setError(t("voice.parseError"));
        } finally {
            setIsProcessing(false);
        }
    }, [session, t]);

    // Execute low-risk
    const handleExecute = useCallback(async () => {
        if (!session?.confirmationToken || !parsedAction) return;
        setIsProcessing(true);
        try {
            await executeVoiceLowRisk(session.sessionId, {
                confirmationToken: session.confirmationToken,
            });
            setSession(null);
            setParsedAction(null);
        } catch {
            setError(t("voice.executeError"));
        } finally {
            setIsProcessing(false);
        }
    }, [session, parsedAction, t]);

    // Reset
    const handleReset = useCallback(() => {
        setSession(null);
        setParsedAction(null);
        setError(null);
    }, []);

    const isLowRisk = parsedAction?.actionType === "EXPENSE" || parsedAction?.actionType === "QUERY";

    return (
        <div className="space-y-6">
            {/* Error */}
            {error && (
                <div className="rounded-2xl bg-error-container p-4 text-on-error-container text-sm">
                    {error}
                    <button onClick={() => setError(null)} className="ml-3 font-bold underline">
                        {t("voice.dismiss")}
                    </button>
                </div>
            )}

            {/* Voice Recorder */}
            <div className="flex flex-col items-center gap-6 rounded-[24px] bg-surface-container-lowest p-8 shadow-sm">
                {/* Record button */}
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className={`flex items-center justify-center w-20 h-20 rounded-full transition-all ${isRecording
                        ? "bg-error text-white animate-pulse scale-110"
                        : "bg-primary text-white hover:bg-primary-container hover:scale-105"
                        } disabled:opacity-50`}
                >
                    <span className="material-symbols-outlined text-3xl">
                        {isRecording ? "stop" : "mic"}
                    </span>
                </button>
                <p className="text-sm text-on-surface-variant">
                    {isRecording ? t("voice.recording") : isProcessing ? t("voice.processing") : t("voice.tapToRecord")}
                </p>

                {/* Waveform indicator when recording */}
                {isRecording && (
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="w-1 bg-error rounded-full animate-pulse"
                                style={{
                                    height: `${Math.random() * 24 + 8}px`,
                                    animationDelay: `${i * 0.1}s`,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Session State Machine */}
            {session && (
                <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm space-y-4">
                    {/* Status badge */}
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-primary">{t("voice.session")}</h3>
                        <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-on-primary-container">
                            {t(`voice.status.${session.status}`)}
                        </span>
                    </div>

                    {/* Draft transcript */}
                    {session.draftTranscript && (
                        <div>
                            <label className="block text-sm font-bold text-on-surface-variant mb-2">
                                {t("voice.transcript")}
                            </label>
                            {session.canEdit ? (
                                <textarea
                                    value={session.draftTranscript}
                                    onChange={(e) => handleDraftEdit(e.target.value)}
                                    className="w-full rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]"
                                />
                            ) : (
                                <p className="rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface">
                                    {session.confirmedTranscript ?? session.draftTranscript}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Confidence */}
                    {session.confidence != null && (
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                            <span className="material-symbols-outlined text-sm">speed</span>
                            {t("voice.confidence", { value: (session.confidence * 100).toFixed(0) })}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        {session.canConfirm && (
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-container transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">check</span>
                                {t("voice.confirm")}
                            </button>
                        )}
                        {session.status === "CONFIRMED" && !parsedAction && (
                            <button
                                onClick={handleParsePreview}
                                disabled={isProcessing}
                                className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-white hover:bg-secondary-container transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                {t("voice.parse")}
                            </button>
                        )}
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 rounded-xl bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            {t("voice.reset")}
                        </button>
                    </div>
                </div>
            )}

            {/* Parsed Action Preview */}
            {parsedAction && (
                <CommandPreview
                    action={parsedAction}
                    onExecute={isLowRisk ? handleExecute : undefined}
                    isProcessing={isProcessing}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// COMMANDS TAB (Text NLP)
// ═══════════════════════════════════════════════════════════

function CommandsTab({ businessId }: { businessId: string }) {
    const t = useTranslations("shop.ai");
    const [input, setInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedAction, setParsedAction] = useState<ParsedAction | null>(null);
    const [confirmationToken, setConfirmationToken] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleParse = useCallback(async () => {
        if (!input.trim()) return;
        setIsProcessing(true);
        setError(null);
        setResult(null);
        setParsedAction(null);

        try {
            const response = await parseAndExecute({
                businessId,
                text: input.trim(),
                confirmationToken: confirmationToken ?? undefined,
            });
            setParsedAction(response.parsedAction);
            if (response.executionResult) {
                setResult(t("commands.executed"));
                setInput("");
                setConfirmationToken(null);
            }
        } catch (err: unknown) {
            // Check if it's a confirmation required error
            const errorData = (err as { response?: { data?: { errorCode?: string; data?: { confirmationToken?: string; parsedAction?: ParsedAction; uncertaintyReason?: string } } } })?.response?.data;
            if (errorData?.errorCode === "CONFIRMATION_REQUIRED") {
                setParsedAction(errorData.data?.parsedAction ?? null);
                setConfirmationToken(errorData.data?.confirmationToken ?? null);
            } else {
                setError(t("commands.error"));
            }
        } finally {
            setIsProcessing(false);
        }
    }, [input, businessId, confirmationToken, t]);

    const handleConfirmExecute = useCallback(async () => {
        if (!confirmationToken || !input.trim()) return;
        setIsProcessing(true);
        try {
            await parseAndExecute({
                businessId,
                text: input.trim(),
                confirmationToken,
            });
            setResult(t("commands.executed"));
            setInput("");
            setParsedAction(null);
            setConfirmationToken(null);
        } catch {
            setError(t("commands.error"));
        } finally {
            setIsProcessing(false);
        }
    }, [confirmationToken, input, businessId, t]);

    const isLowRisk = parsedAction?.actionType === "EXPENSE" || parsedAction?.actionType === "QUERY";

    return (
        <div className="space-y-6">
            {/* Error */}
            {error && (
                <div className="rounded-2xl bg-error-container p-4 text-on-error-container text-sm">
                    {error}
                </div>
            )}

            {/* Success */}
            {result && (
                <div className="rounded-2xl bg-secondary-container/20 p-4 text-secondary text-sm font-bold">
                    <span className="material-symbols-outlined text-sm align-middle mr-2">check_circle</span>
                    {result}
                </div>
            )}

            {/* Command Input */}
            <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
                <h3 className="font-bold text-primary mb-4">{t("commands.title")}</h3>
                <p className="text-sm text-on-surface-variant mb-4">{t("commands.hint")}</p>

                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t("commands.placeholder")}
                        className="flex-1 rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !confirmationToken) handleParse();
                        }}
                        disabled={isProcessing}
                    />
                    <button
                        onClick={confirmationToken ? handleConfirmExecute : handleParse}
                        disabled={!input.trim() || isProcessing}
                        className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-colors disabled:opacity-50 ${confirmationToken
                            ? "bg-secondary hover:bg-secondary-container"
                            : "bg-primary hover:bg-primary-container"
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">
                            {isProcessing ? "progress_activity" : confirmationToken ? "check" : "auto_awesome"}
                        </span>
                        {confirmationToken ? t("commands.confirm") : t("commands.parse")}
                    </button>
                </div>

                {/* Quick command examples */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {(["sale", "expense", "dueBaki", "dueJoma", "query"] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setInput(t(`commands.examples.${type}`))}
                            className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        >
                            {t(`commands.examples.${type}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Parsed Action Preview */}
            {parsedAction && (
                <CommandPreview
                    action={parsedAction}
                    onExecute={isLowRisk ? handleConfirmExecute : undefined}
                    isProcessing={isProcessing}
                    confirmationToken={confirmationToken}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SHARED: Command Preview Component
// ═══════════════════════════════════════════════════════════

function CommandPreview({
    action,
    onExecute,
    isProcessing,
    confirmationToken,
}: {
    action: ParsedAction;
    onExecute?: () => void;
    isProcessing: boolean;
    confirmationToken?: string | null;
}) {
    const t = useTranslations("shop.ai");
    const meta = ACTION_META[action.actionType] ?? ACTION_META.UNKNOWN;

    return (
        <div className="relative overflow-hidden rounded-[24px] bg-surface-container-lowest p-6 shadow-sm">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

            <div className="relative space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container ${meta.color}`}>
                        <span className="material-symbols-outlined">{meta.icon}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-on-surface">{t(`actions.${action.actionType}`)}</h3>
                        <p className="text-xs text-on-surface-variant">
                            {t("commands.originalText")}: &ldquo;{action.originalText}&rdquo;
                        </p>
                    </div>
                    <div className="ml-auto">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${action.confidenceScore > 0.8
                            ? "bg-secondary-container text-on-secondary-container"
                            : action.confidenceScore > 0.5
                                ? "bg-tertiary-container text-on-tertiary-container"
                                : "bg-error-container text-on-error-container"
                            }`}>
                            {(action.confidenceScore * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>

                {/* Structured output */}
                {action.structuredOutput && (
                    <div className="rounded-xl bg-surface-container p-4">
                        <pre className="text-xs text-on-surface whitespace-pre-wrap font-mono">
                            {action.structuredOutput}
                        </pre>
                    </div>
                )}

                {/* Uncertainty warning */}
                {action.needsConfirmation && action.uncertaintyReason && (
                    <div className="rounded-xl bg-tertiary-container/20 p-4 text-sm text-on-surface">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-tertiary">warning</span>
                            <span className="font-bold text-tertiary">{t("commands.needsConfirmation")}</span>
                        </div>
                        <p className="mt-1 text-on-surface-variant">{action.uncertaintyReason}</p>
                    </div>
                )}

                {/* Execute button (low-risk only) */}
                {onExecute && (
                    <button
                        onClick={onExecute}
                        disabled={isProcessing}
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-container transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-sm">
                            {isProcessing ? "progress_activity" : "play_arrow"}
                        </span>
                        {t("commands.execute")}
                    </button>
                )}

                {/* High-risk notice */}
                {!onExecute && action.actionType !== "QUERY" && action.actionType !== "UNKNOWN" && (
                    <div className="rounded-xl bg-error-container/20 p-4 text-sm text-error">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">shield</span>
                            <span className="font-bold">{t("commands.highRisk")}</span>
                        </div>
                        <p className="mt-1">{t("commands.highRiskHint")}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

