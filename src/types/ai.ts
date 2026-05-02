/**
 * AI Module Types
 * Aligned with backend: AIController, VoiceSessionController
 * SRS Reference: Section 9 - AI Integration
 */

// ─── Enums ───────────────────────────────────────────────

export type AIActionType =
    | "SALE"
    | "EXPENSE"
    | "DUE_BAKI"
    | "DUE_JOMA"
    | "DISCOUNT"
    | "ADD_PRODUCT"
    | "RETURN"
    | "QUERY"
    | "UNKNOWN";

export type VoiceSessionStatus =
    | "DRAFT"
    | "TRANSCRIBED"
    | "EDITED"
    | "CONFIRMED"
    | "EXECUTED"
    | "CANCELLED"
    | "EXPIRED";

export type AIMessageRole = "USER" | "ASSISTANT" | "SYSTEM";

// ─── Request Types ───────────────────────────────────────

export interface AIChatRequest {
    businessId: string;
    conversationId?: string;
    message: string;
}

export interface AIParseRequest {
    businessId: string;
    text: string;
    confirmationToken?: string;
    idempotencyKey?: string;
    /** Optional scope restriction: "PRODUCT_ONLY" = only ADD_PRODUCT allowed */
    scope?: string;
}

export interface VoiceSessionCreateRequest {
    businessId: string;
}

export interface VoiceDraftUpdateRequest {
    draftText: string;
}

export interface VoiceParsePreviewRequest {
    confirmationToken: string;
}

export interface VoiceExecuteRequest {
    confirmationToken: string;
}

// ─── Response Types ──────────────────────────────────────

export interface AIResponse {
    conversationId: string;
    messageId: string;
    content: string;
    actionType: AIActionType | null;
    structuredOutput: string | null;
    confidenceScore: number | null;
    provider: string | null;
    model: string | null;
    inputTokens: number;
    outputTokens: number;
    responseTimeMs: number;
}

export interface AIUsageStats {
    queriesToday: number;
    queriesLimit: number;
    totalQueriesThisMonth: number;
    totalTokensUsed: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    mostUsedModel: string | null;
    preferredProvider: string | null;
}

export interface ParsedAction {
    actionType: AIActionType;
    structuredOutput: string | null;
    confidenceScore: number;
    originalText: string;
    sanitizedName: string | null;
    needsConfirmation: boolean;
    uncertaintyReason: string | null;
}

export interface ConversationSummary {
    id: string;
    title: string;
    messageCount: number;
    lastMessage: string;
    createdAt: string;
    lastActivityAt: string;
}

export interface AIMessage {
    id: string;
    conversationId: string;
    role: AIMessageRole;
    content: string;
    actionType: AIActionType | null;
    structuredOutput: string | null;
    confidenceScore: number | null;
    createdAt: string;
}

export interface ConversationDetail {
    conversationId: string;
    messages: AIMessage[];
}

export interface VoiceSessionResponse {
    sessionId: string;
    businessId: string;
    status: VoiceSessionStatus;
    draftTranscript: string | null;
    originalTranscript: string | null;
    confirmedTranscript: string | null;
    sttProvider: string | null;
    confidence: number | null;
    confirmationToken: string | null;
    transcribedAt: string | null;
    confirmedAt: string | null;
    createdAt: string;
    updatedAt: string;
    canEdit: boolean;
    canConfirm: boolean;
}

export interface VoiceParsePreviewResponse {
    sessionId: string;
    businessId: string;
    confirmedText: string;
    parsedAction: ParsedAction;
    previewedAt: string;
}

export interface VoiceExecuteResponse {
    sessionId: string;
    businessId: string;
    confirmedText: string;
    parsedAction: ParsedAction;
    executedActionType: AIActionType;
    executionResult: Record<string, unknown>;
    executedAt: string;
}

// ─── Parse & Execute Combined Response ───────────────────

export interface ParseAndExecuteResponse {
    parsedAction: ParsedAction;
    executionResult: Record<string, unknown> | null;
}

export interface ConfirmationRequiredResponse {
    parsedAction: ParsedAction;
    uncertaintyReason: string;
    confirmationToken: string;
}

// ─── Parsed Product (from AI voice/text parse) ───────────

export interface ParsedProduct {
    name: string | null;
    unit: string | null;
    costPrice: number | null;
    sellPrice: number | null;
    stockQty: number | null;
    reorderPoint: number | null;
    categoryName: string | null;
    subCategoryName: string | null;
    existingProductId: string | null;
    isNew: boolean;
    confidenceScore: number | null;
}

// ─── Streaming SSE Events ────────────────────────────────

/** SSE event types received from /ai/chat/stream */
export type SSEEventType = "meta" | "token" | "done" | "error";

/** SSE meta event — carries conversationId */
export interface SSEMetaEvent {
    conversationId: string;
}

/** SSE error event */
export interface SSEErrorEvent {
    message: string;
}

// ─── Paged Results ───────────────────────────────────────

export interface PagedConversations {
    content: ConversationSummary[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}
