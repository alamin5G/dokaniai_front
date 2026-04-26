/**
 * Weekly AI Business Insight Types
 * Matches backend DTO: WeeklyBusinessInsightResponse
 */

// Status of the weekly insight
export type WeeklyInsightStatus = "AVAILABLE" | "NO_DATA" | "EXPIRED";

// Priority levels for stock recommendations
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM";

// Impact/Confidence levels for tips and suggestions
export type ImpactLevel = "HIGH" | "MEDIUM" | "LOW";

// Sales Analysis section
export interface SalesAnalysis {
    summary: string;
    total_items_sold: number;
    total_revenue: number;
    week_over_week_change_percent: number | null;
    top_selling_products: TopSellingProduct[];
    trend: string;
    suggestion: string;
}

export interface TopSellingProduct {
    name: string;
    quantity: number;
    revenue: number;
}

// Profit Analysis section
export interface ProfitAnalysis {
    total_profit: number;
    total_revenue: number;
    profit_margin_percent: number;
    profitable_products: ProfitableProduct[];
    loss_products: LossProduct[];
    summary: string;
    suggestion: string;
}

export interface ProfitableProduct {
    name: string;
    profit: number;
    margin_percent: number;
}

export interface LossProduct {
    name: string;
    loss: number;
    reason: string;
}

// Stock Recommendations section
export interface StockRecommendation {
    product: string;
    current_stock: number;
    suggested_restock: number;
    reason: string;
    priority: Priority;
}

// Improvement Tips section
export interface ImprovementTip {
    title: string;
    description: string;
    impact: ImpactLevel;
}

// Product Suggestions section
export interface ProductSuggestion {
    name: string;
    reason: string;
    estimated_demand: string;
    confidence: ImpactLevel;
}

// Token usage metadata
export interface TokenUsage {
    input: number;
    output: number;
}

// Main response type — matches backend WeeklyBusinessInsightResponse
export interface WeeklyBusinessInsight {
    id: string | null;
    weekStart: string | null;
    weekEnd: string | null;
    salesAnalysis: SalesAnalysis | null;
    profitAnalysis: ProfitAnalysis | null;
    stockRecommendations: StockRecommendation[] | null;
    improvementTips: ImprovementTip[] | null;
    productSuggestions: ProductSuggestion[] | null;
    generatedAt: string | null;
    expiresAt: string | null;
    daysUntilNext: number;
    hoursUntilNext: number;
    aiModel: string;
    tokenUsage: TokenUsage | null;
    status: WeeklyInsightStatus;
    message: string;
}