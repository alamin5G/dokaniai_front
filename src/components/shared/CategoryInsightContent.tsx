"use client";

import React from "react";

/**
 * Shared render component for AI-generated category market insight text.
 *
 * Used by:
 * - CategoryMarketInsightCard (Products page — card wrapper with gradient border)
 * - ProductSelector (Sales page — inline empty state, no card wrapper)
 *
 * Handles lightweight markdown: **bold**, *italic*, bullet points, newlines.
 */
function renderMarkdown(text: string): React.ReactNode[] {
    const lines = text.split(/\n+/);
    const nodes: React.ReactNode[] = [];

    lines.forEach((line, lineIdx) => {
        if (lineIdx > 0) {
            nodes.push(<br key={`br-${lineIdx}`} />);
        }

        const processed = line.replace(/^\*\s+/, "• ");

        const parts = processed.split(
            /(\*\*[^*]+\*\*|\*(?!\*)[^*]+\*(?!\*))/g
        );
        parts.forEach((part, partIdx) => {
            const key = `l${lineIdx}-p${partIdx}`;
            if (part.startsWith("**") && part.endsWith("**")) {
                nodes.push(<strong key={key}>{part.slice(2, -2)}</strong>);
            } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
                nodes.push(<em key={key}>{part.slice(1, -1)}</em>);
            } else {
                nodes.push(part);
            }
        });
    });

    return nodes;
}

interface CategoryInsightContentProps {
    insight: string;
}

export default function CategoryInsightContent({ insight }: CategoryInsightContentProps) {
    return (
        <p className="text-sm leading-relaxed text-on-surface">
            {renderMarkdown(insight)}
        </p>
    );
}