"use client";

import React from "react";

interface ChartErrorBoundaryProps {
    children: React.ReactNode;
    fallbackTitle?: string;
}

interface ChartErrorBoundaryState {
    hasError: boolean;
}

/**
 * Catches rendering errors in chart components and shows a graceful fallback
 * instead of crashing the entire dashboard. Each chart wraps itself in this
 * boundary so one broken chart doesn't take down the others.
 */
export class ChartErrorBoundary extends React.Component<
    ChartErrorBoundaryProps,
    ChartErrorBoundaryState
> {
    constructor(props: ChartErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ChartErrorBoundaryState {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-48 text-on-surface/50">
                    <span className="material-symbols-outlined text-3xl mb-2">
                        broken_image
                    </span>
                    <p className="text-sm">
                        {this.props.fallbackTitle ?? "Chart unavailable"}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}