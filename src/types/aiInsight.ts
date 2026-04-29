/**
 * AI Insight Types
 * Purpose: Type definitions for AI-powered insights (DB-persisted)
 */

export type AIInsightType =
    | "STOCK_PREDICTION"
    | "EXPENSE_ANOMALY"
    | "SALES_TREND"
    | "BUSINESS_TIP"
    | "WEEKLY_SUMMARY"
    | "EXPENSE_INTELLIGENCE"
    | "DUE_INTELLIGENCE"
    | "DAILY_SUMMARY"
    | "CUSTOMER_ANALYTICS"
    | "SALES_FORECAST"
    | "PROFIT_OPTIMIZATION"
    | "SEASONAL_TRENDS"
    | "MORNING_BRIEFING"
    | "RETURN_ANALYSIS";
export type AIInsightSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AIInsightEntityType = "PRODUCT" | "EXPENSE" | "BUSINESS" | "SALE";
export type AIConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface AIInsightActionData {
    currentStock?: number;
    dailyAvgSales?: number;
    estimatedDaysRemaining?: number;
    suggestedOrderQty?: number;
    suggestedOrderDate?: string;
    confidenceLevel?: AIConfidenceLevel;
    aiReasoning?: string;
}

export interface AIInsight {
    id: string;
    businessId: string;
    type: AIInsightType;
    title: string;
    message: string;
    severity: AIInsightSeverity;
    entityType: AIInsightEntityType;
    entityId: string;
    confidence: number;
    actionSuggested: string | null;
    actionData: AIInsightActionData | null;
    isRead: boolean;
    createdAt: string;
    validUntil: string | null;
}
