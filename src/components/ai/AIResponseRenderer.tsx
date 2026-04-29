"use client";

import { useMemo } from "react";

interface AIResponseRendererProps {
    content: string;
    variant?: "ai" | "user" | "system";
    className?: string;
}

export default function AIResponseRenderer({
    content,
    variant = "ai",
    className = "",
}: AIResponseRendererProps) {
    const processed = useMemo(() => {
        if (!content) return [];

        const segments: { type: "text" | "code" | "bold" | "heading" | "list" | "numbered-list"; content: string; num?: string }[] = [];
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

            // Numbered list: "1.", "2.", "৩.", "১." (Bengali digits)
            const numberedMatch = line.match(/^(\d+|[০-৯]+)[.)]\s+(.*)/);
            if (numberedMatch) {
                segments.push({ type: "numbered-list", content: numberedMatch[2], num: numberedMatch[1] });
                continue;
            }

            // Bullet list
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
                    <p key={idx} className="font-bold text-on-surface mt-2 mb-1">{renderInlineBold(seg.content)}</p>
                );
            case "list":
                return (
                    <div key={idx} className="flex items-start gap-2 ml-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <span>{renderInlineBold(seg.content)}</span>
                    </div>
                );
            case "numbered-list":
                return (
                    <div key={idx} className="flex items-start gap-2 ml-1">
                        <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                            {seg.num}
                        </span>
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
                return <strong key={i} className="font-semibold text-on-surface">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    return (
        <div className={`text-sm leading-relaxed ${baseClass} ${className}`}>
            {processed.map((seg, idx) => renderSegment(seg, idx))}
        </div>
    );
}