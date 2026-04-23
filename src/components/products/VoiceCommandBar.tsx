"use client";

import { sendVoiceQuery } from "@/lib/aiApi";
import { useBusinessStore } from "@/store/businessStore";
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

type VoiceState = "idle" | "recording" | "processing" | "done" | "error";

export default function VoiceCommandBar() {
    const t = useTranslations("shop.products.voice");
    const activeBusinessId = useBusinessStore((s) => s.activeBusinessId);

    const [voiceState, setVoiceState] = useState<VoiceState>("idle");
    const [transcript, setTranscript] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

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
                // Stop all tracks to release microphone
                stream.getTracks().forEach((track) => track.stop());

                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                chunksRef.current = [];

                if (!activeBusinessId) {
                    setVoiceState("error");
                    setErrorMsg("No active business");
                    return;
                }

                setVoiceState("processing");

                try {
                    const result = await sendVoiceQuery(blob, activeBusinessId);
                    const text = result.content ?? "";
                    setTranscript(text);
                    setVoiceState("done");
                } catch (err) {
                    setVoiceState("error");
                    setErrorMsg(
                        err instanceof Error ? err.message : "Voice processing failed",
                    );
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setVoiceState("recording");
            setErrorMsg("");
        } catch (err) {
            setVoiceState("error");
            setErrorMsg(
                err instanceof Error
                    ? err.message
                    : "Microphone access denied",
            );
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
    // Reset
    // -----------------------------------------------------------------------
    const handleReset = useCallback(() => {
        setTranscript("");
        setErrorMsg("");
        setVoiceState("idle");
    }, []);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    const isRecording = voiceState === "recording";
    const isProcessing = voiceState === "processing";

    return (
        <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-3 py-2">
            {/* Mic / Stop button */}
            <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all ${isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : isProcessing
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

            {/* Text field / status */}
            <div className="flex-1 min-w-0">
                {voiceState === "idle" && (
                    <p className="text-xs text-on-surface-variant truncate">
                        {t("placeholder")}
                    </p>
                )}
                {isRecording && (
                    <p className="text-xs font-semibold text-red-600 truncate">
                        🔴 রেকর্ড হচ্ছে...
                    </p>
                )}
                {isProcessing && (
                    <p className="text-xs text-primary font-medium truncate">
                        ⏳ প্রসেসিং হচ্ছে...
                    </p>
                )}
                {(voiceState === "done" || voiceState === "error") && (
                    <input
                        type="text"
                        value={voiceState === "error" ? errorMsg : transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder={t("placeholder")}
                        className={`w-full bg-transparent text-xs outline-none ${voiceState === "error"
                            ? "text-red-600"
                            : "text-on-surface"
                            }`}
                    />
                )}
            </div>

            {/* Send / Reset button */}
            {(voiceState === "done" || voiceState === "error") && (
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        title="রিসেট"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18 18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                    {transcript.trim() && (
                        <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary hover:brightness-105 active:scale-95 transition-all"
                            title="পাঠান"
                        >
                            <IconSend className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}


