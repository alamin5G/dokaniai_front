/**
 * Restock Intelligence Types
 * Purpose: Type definitions for AI-powered restock insights and stock predictions
 */

export interface RestockInsight {
    productId: string;
    productName: string;
    insightType: "MILESTONE" | "PATTERN" | "PREDICTION" | "NEW_PRODUCT" | "CROSS_SELL";
    insightText: string;
    suggestedAction: string;
    confidenceScore: number;
    generatedAt: string;
    expiresAt: string;
}

export interface StockPrediction {
    productId: string;
    productName: string;
    currentStock: number;
    dailyAvgSales: number;
    estimatedDaysRemaining: number;
    suggestedOrderQty: number;
    suggestedOrderDate: string;
    confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
    aiReasoning: string;
}
