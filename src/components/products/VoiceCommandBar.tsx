"use client";

import { parseText } from "@/lib/aiApi";
import { useBusinessStore } from "@/store/businessStore";
import type { ParsedAction } from "@/types/ai";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

function IconMic({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
            />
        </svg>
    );
}

function IconStop({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z"
            />
        </svg>
    );
}

function IconSend({ className = "w-5 h-5" }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={className}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
            />
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Voice Command Bar Component
// ---------------------------------------------------------------------------

type MicState = "idle" | "recording" | "transcribing";

export default function VoiceCommandBar() {
    const t = useTranslations("shop.products.voice");
    const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);

    // Text input — always editable (user can type or use voice)
    const [textInput, setTextInput] = useState("");

    // Mic recording state
    const [micState, setMicState] = useState<MicState>("idle");

    // NLP parse result
    const [parsedResult, setParsedResult] = useState<ParsedAction | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // -----------------------------------------------------------------------
    // Start recording
    // -----------------------------------------------------------------------
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                    ? "audio/webm;codecs=opus"
                    : "audio/webm",
            });

            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Release microphone
                stream.getTracks().forEach((track) => track.stop());

                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                chunksRef.current = [];

                if (!activeBusinessId) {
                    setMicState("idle");
                    return;
                }

                setMicState("transcribing");

                try {
                    // Send audio to Spring Boot API → STT service → get transcript
                    // We use the /ai/voice endpoint which returns AIResponse with content
                    const { sendVoiceQuery } = await import("@/lib/aiApi");
                    const result = await sendVoiceQuery(blob, activeBusinessId);
                    const transcript = result.content ?? "";
                    if (transcript) {
                        setTextInput(transcript);
                    }
                } catch {
                    // STT failed — user can still type manually
                } finally {
                    setMicState("idle");
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setMicState("recording");
            setParseError(null);
            setParsedResult(null);
        } catch {
            setMicState("idle");
        }
    }, [activeBusinessId]);

    // -----------------------------------------------------------------------
    // Stop recording
    // -----------------------------------------------------------------------
    const stopRecording = useCallback(() => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
        ) {
            mediaRecorderRef.current.stop();
        }
    }, []);

    // -----------------------------------------------------------------------
    // Submit text for NLP parsing
    // -----------------------------------------------------------------------
    const handleSubmit = useCallback(async () => {
        const text = textInput.trim();
        if (!text || !activeBusinessId) return;

        setIsParsing(true);
        setParseError(null);
        setParsedResult(null);

        try {
            const result = await parseText({
                businessId: activeBusinessId,
                text,
            });
            setParsedResult(result);
        } catch (err) {
            setParseError(
                err instanceof Error ? err.message : "পার্সিং ব্যর্থ হয়েছে",
            );
        } finally {
            setIsParsing(false);
        }
    }, [textInput, activeBusinessId]);

    // -----------------------------------------------------------------------
    // Handle Enter key in text input
    // -----------------------------------------------------------------------
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
            }
        },
        [handleSubmit],
    );

    // -----------------------------------------------------------------------
    // Confirm / Cancel parsed result
    // -----------------------------------------------------------------------
    const handleConfirm = useCallback(() => {
        // TODO: Execute the parsed action (e.g., create sale, add product)
        // For now, clear the bar after confirmation
        setParsedResult(null);
        setTextInput("");
    }, []);

    const handleCancelParse = useCallback(() => {
        setParsedResult(null);
        setParseError(null);
    }, []);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    const isRecording = micState === "recording";
    const isTranscribing = micState === "transcribing";
    const hasText = textInput.trim().length > 0;

    return (
        <div className="space-y-2">
            {/* Main input bar */}
            <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-3 py-2">
                {/* Mic button */}
                <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing || isParsing}
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all ${isRecording
                            ? "bg-red-500 text-white animate-pulse"
                            : isTranscribing
                                ? "bg-primary/30 text-primary cursor-wait"
                                : "bg-primary text-on-primary hover:brightness-105 active:scale-95"
                        }`}
                    title={isRecording ? "রেকর্ড বন্ধ করুন" : "রেকর্ড শুরু করুন"}
                >
                    {isRecording ? (
                        <IconStop className="w-5 h-5" />
                    ) : (
                        <IconMic className="w-5 h-5" />
                    )}
                </button>

                {/* Always-editable text input */}
                <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("placeholder")}
                    disabled={isTranscribing || isParsing}
                    className="flex-1 min-w-0 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant disabled:opacity-50"
                />

                {/* Recording indicator */}
                {isRecording && (
                    <span className="text-xs font-semibold text-red-600 flex-shrink-0">
                        🔴 রেকর্ডিং...
                    </span>
                )}
                {isTranscribing && (
                    <span className="text-xs text-primary font-medium flex-shrink-0">
                        ⏳ ট্রান্সক্রাইবিং...
                    </span>
                )}

                {/* Send button */}
                {hasText && !isRecording && !isTranscribing && (
                    <button
                        type="button"
                        onClick={() => void handleSubmit()}
                        disabled={isParsing}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-on-primary hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
                        title="পাঠান"
                    >
                        <IconSend className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Parsing loading */}
            {isParsing && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-primary">
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span>AI পার্স করছে...</span>
                </div>
            )}

            {/* Parse error */}
            {parseError && (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-rose-50 px-4 py-2 text-xs text-rose-700">
                    <span>{parseError}</span>
                    <button
                        type="button"
                        onClick={handleCancelParse}
                        className="font-semibold hover:underline"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Parsed result confirmation */}
            {parsedResult && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm">
                    <p className="mb-2 font-semibold text-emerald-800">
                        AI বুঝেছে — নিশ্চিত করুন
                    </p>
                    <div className="space-y-1 text-xs text-emerald-700">
                        <p>
                            <span className="font-medium">অ্যাকশন:</span>{" "}
                            {parsedResult.actionType}
                        </p>
                        {parsedResult.structuredOutput && (
                            <p>
                                <span className="font-medium">ডেটা:</span>{" "}
                                {parsedResult.structuredOutput}
                            </p>
                        )}
                        <p>
                            <span className="font-medium">কনফিডেন্স:</span>{" "}
                            {Math.round((parsedResult.confidenceScore ?? 0) * 100)}%
                        </p>
                        {parsedResult.uncertaintyReason && (
                            <p className="text-amber-600">
                                ⚠️ {parsedResult.uncertaintyReason}
                            </p>
                        )}
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                        >
                            ✓ ঠিক আছে
                        </button>
                        <button
                            type="button"
                            onClick={handleCancelParse}
                            className="rounded-lg bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 transition-colors"
                        >
                            ✗ ভুল হয়েছে
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
