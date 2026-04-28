"use client";

import { useMemo } from "react";

interface AIResponseRendererProps {
    content: string;
    variant?: "ai" | "user" | "system";
}

export default function AIResponseRenderer({
    content,
    variant = "ai",
}: AIResponseRendererProps) {
    const processed = useMemo(() => {
        if (!content) return [];

        // Split into segments: code blocks, bold text, and regular text
        const segments: { type: "text" | "code" | "bold" | "heading" | "list"; content: string }[] = [];
        const lines = content.split("\n");
        let inCodeBlock = false;
        let codeBuffer: string[] = [];

        for (const line of lines) {
            if (line.startsWith("```")) {
                if (inCodeBlock) {
                    segments.push({ type: "code", content: codeBuffer.join("\n") });
                    codeBuffer = [];
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                }
                continue;
            }

            if (inCodeBlock) {
                codeBuffer.push(line);
                continue;
            }

            // Heading
            if (line.startsWith("### ")) {
                segments.push({ type: "heading", content: line.slice(4) });
                continue;
            }
            if (line.startsWith("## ")) {
                segments.push({ type: "heading", content: line.slice(3) });
                continue;
            }

            // List item
            if (line.startsWith("- ") || line.startsWith("• ") || line.startsWith("* ")) {
                segments.push({ type: "list", content: line.slice(2) });
                continue;
            }

            // Regular text (process inline bold)
            if (line.trim()) {
                segments.push({ type: "text", content: line });
            }
        }

        return segments;
    }, [content]);

    const baseClass = variant === "ai"
        ? "text-on-surface"
        : variant === "user"
            ? "text-on-surface"
            : "text-on-surface-variant";

    const renderSegment = (seg: typeof processed[number], idx: number) => {
        switch (seg.type) {
            case "code":
                return (
                    <pre key={idx} className="my-2 overflow-x-auto rounded-xl bg-surface-container p-3 text-xs font-mono text-on-surface-variant">
                        <code>{seg.content}</code>
                    </pre>
                );
            case "heading":
                return (
                    <p key={idx} className="font-bold text-on-surface mt-2 mb-1">{seg.content}</p>
                );
            case "list":
                return (
                    <div key={idx} className="flex items-start gap-2 ml-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span>{renderInlineBold(seg.content)}</span>
                    </div>
                );
            case "text":
            default:
                return <p key={idx} className="my-0.5">{renderInlineBold(seg.content)}</p>;
        }
    };

    const renderInlineBold = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className={`text-sm leading-relaxed ${baseClass}`}>
            {processed.map((seg, idx) => renderSegment(seg, idx))}
        </div>
    );
}