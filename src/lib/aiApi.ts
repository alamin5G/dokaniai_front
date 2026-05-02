import apiClient from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type {
    AIChatRequest,
    AIResponse,
    AIUsageStats,
    AIParseRequest,
    ParsedAction,
    ConversationSummary,
    ConversationDetail,
    VoiceSessionCreateRequest,
    VoiceSessionResponse,
    VoiceDraftUpdateRequest,
    VoiceParsePreviewRequest,
    VoiceParsePreviewResponse,
    VoiceExecuteRequest,
    VoiceExecuteResponse,
    PagedConversations,
    ParseAndExecuteResponse,
    SSEMetaEvent,
    SSEErrorEvent,
} from "@/types/ai";

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

interface ApiError {
    success: false;
    errorCode: string;
    message: string;
    data?: unknown;
}

type ApiResponse<T> = { data: ApiSuccess<T> };

function unwrap<T>(response: ApiResponse<T>): T {
    return response.data.data;
}

// ─── AI Chat Endpoints ───────────────────────────────────

export async function sendChatMessage(request: AIChatRequest): Promise<AIResponse> {
    const response = await apiClient.post<ApiSuccess<AIResponse>>("/ai/chat", request);
    return unwrap(response);
}

export async function sendVoiceQuery(
    audioBlob: Blob,
    businessId: string,
    conversationId?: string,
): Promise<AIResponse> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("businessId", businessId);
    if (conversationId) {
        formData.append("conversationId", conversationId);
    }

    const response = await apiClient.post<ApiSuccess<AIResponse>>("/ai/voice", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(response);
}

export async function getConversations(
    page = 0,
    size = 20,
): Promise<PagedConversations> {
    const response = await apiClient.get<ApiSuccess<PagedConversations>>("/ai/conversations", {
        params: { page, size },
    });
    return unwrap(response);
}

export async function getConversation(conversationId: string): Promise<ConversationDetail> {
    const response = await apiClient.get<ApiSuccess<ConversationDetail>>(
        `/ai/conversations/${conversationId}`,
    );
    return unwrap(response);
}

export async function deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/ai/conversations/${conversationId}`);
}

// ─── AI Parse & Execute Endpoints ────────────────────────

export async function parseText(request: AIParseRequest): Promise<ParsedAction> {
    const response = await apiClient.post<ApiSuccess<ParsedAction>>("/ai/parse", request);
    return unwrap(response);
}

export async function parseAndExecute(
    request: AIParseRequest,
): Promise<ParseAndExecuteResponse> {
    const response = await apiClient.post<ApiSuccess<ParseAndExecuteResponse>>(
        "/ai/parse/execute",
        request,
    );
    return unwrap(response);
}

// ─── Voice Session Endpoints ─────────────────────────────

export async function createVoiceSession(
    request: VoiceSessionCreateRequest,
): Promise<VoiceSessionResponse> {
    const response = await apiClient.post<ApiSuccess<VoiceSessionResponse>>(
        "/voice/sessions",
        request,
    );
    return unwrap(response);
}

export async function transcribeVoiceSession(
    sessionId: string,
    audioBlob: Blob,
): Promise<VoiceSessionResponse> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const response = await apiClient.post<ApiSuccess<VoiceSessionResponse>>(
        `/voice/sessions/${sessionId}/transcribe`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return unwrap(response);
}

export async function updateVoiceDraft(
    sessionId: string,
    request: VoiceDraftUpdateRequest,
): Promise<VoiceSessionResponse> {
    const response = await apiClient.patch<ApiSuccess<VoiceSessionResponse>>(
        `/voice/sessions/${sessionId}/draft`,
        request,
    );
    return unwrap(response);
}

export async function confirmVoiceDraft(sessionId: string): Promise<VoiceSessionResponse> {
    const response = await apiClient.post<ApiSuccess<VoiceSessionResponse>>(
        `/voice/sessions/${sessionId}/confirm`,
    );
    return unwrap(response);
}

export async function getVoiceSession(sessionId: string): Promise<VoiceSessionResponse> {
    const response = await apiClient.get<ApiSuccess<VoiceSessionResponse>>(
        `/voice/sessions/${sessionId}`,
    );
    return unwrap(response);
}

export async function parseVoicePreview(
    sessionId: string,
    request: VoiceParsePreviewRequest,
): Promise<VoiceParsePreviewResponse> {
    const response = await apiClient.post<ApiSuccess<VoiceParsePreviewResponse>>(
        `/voice/sessions/${sessionId}/parse-preview`,
        request,
    );
    return unwrap(response);
}

export async function executeVoiceLowRisk(
    sessionId: string,
    request: VoiceExecuteRequest,
): Promise<VoiceExecuteResponse> {
    const response = await apiClient.post<ApiSuccess<VoiceExecuteResponse>>(
        `/voice/sessions/${sessionId}/execute-low-risk`,
        request,
    );
    return unwrap(response);
}

// ─── AI Usage Stats ──────────────────────────────────────

export async function getAIUsageStats(): Promise<AIUsageStats> {
    const response = await apiClient.get<ApiSuccess<AIUsageStats>>("/ai/usage");
    return unwrap(response);
}

// ─── AI Streaming Chat (SSE) ─────────────────────────────

export interface StreamCallbacks {
    /** Called with conversation metadata (conversationId) */
    onMeta?: (meta: SSEMetaEvent) => void;
    /** Called for each streamed token/chunk */
    onToken: (token: string) => void;
    /** Called when the stream completes */
    onDone: () => void;
    /** Called on error */
    onError?: (error: SSEErrorEvent) => void;
}

/**
 * Stream an AI chat response using Server-Sent Events (SSE).
 *
 * Uses the native `fetch` API because `EventSource` only supports GET requests,
 * but our backend endpoint is POST with a JSON body.
 *
 * SSE event types from backend:
 *   - `meta`  → { conversationId: string }
 *   - `token` → raw text chunk
 *   - `done`  → "[DONE]"
 *   - `error` → { message: string }
 */
export async function streamChatMessage(
    request: AIChatRequest,
    callbacks: StreamCallbacks,
): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082/api/v1";
    const { accessToken } = useAuthStore.getState();

    try {
        const response = await fetch(`${baseUrl}/ai/chat/stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                Accept: "text/event-stream",
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorText = await response.text();
            callbacks.onError?.({ message: `HTTP ${response.status}: ${errorText}` });
            callbacks.onDone();
            return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
            callbacks.onError?.({ message: "No response body" });
            callbacks.onDone();
            return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events from buffer
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // keep incomplete last line

            let currentEvent = "";
            let currentData = "";

            for (const line of lines) {
                if (line.startsWith("event:")) {
                    currentEvent = line.slice(6).trim();
                } else if (line.startsWith("data:")) {
                    currentData = line.slice(5).trim();
                } else if (line === "") {
                    // Empty line = end of SSE event
                    if (currentEvent && currentData) {
                        dispatchSSEEvent(currentEvent, currentData, callbacks);
                    }
                    currentEvent = "";
                    currentData = "";
                }
            }
        }

        // Process any remaining data in buffer
        if (buffer.startsWith("data:")) {
            const remainingData = buffer.slice(5).trim();
            if (remainingData) {
                dispatchSSEEvent("", remainingData, callbacks);
            }
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown streaming error";
        callbacks.onError?.({ message });
    } finally {
        callbacks.onDone();
    }
}

function dispatchSSEEvent(
    event: string,
    data: string,
    callbacks: StreamCallbacks,
): void {
    switch (event) {
        case "meta":
            try {
                callbacks.onMeta?.(JSON.parse(data) as SSEMetaEvent);
            } catch { /* ignore parse error */ }
            break;
        case "token":
            callbacks.onToken(data);
            break;
        case "done":
            // Stream complete
            break;
        case "error":
            try {
                callbacks.onError?.(JSON.parse(data) as SSEErrorEvent);
            } catch {
                callbacks.onError?.({ message: data });
            }
            break;
        default:
            // For unnamed events, treat data as token
            if (data && data !== "[DONE]") {
                callbacks.onToken(data);
            }
            break;
    }
}
