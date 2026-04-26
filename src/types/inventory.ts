/**
 * Inventory Management Types
 * Aligned with backend: InventoryController, InventoryLog entity
 * SRS Reference: FR-STOCK-01 to FR-STOCK-03, FR-RETURN-02, FR-RPT-07
 */

// ─── Enums ───────────────────────────────────────────────

/**
 * Inventory change types — tracks why stock changed.
 * SALE: stock decreased by a sale
 * RETURN: stock increased by a sale return (FR-RETURN-02)
 * RESTOCK: stock increased by manual restock
 * ADJUSTMENT: manual correction (gain or loss)
 * INITIAL: stock set when product first created
 */
export type InventoryAction = "SALE" | "RETURN" | "RESTOCK" | "ADJUSTMENT" | "INITIAL";

// ─── Inventory Log ───────────────────────────────────────

export interface InventoryLog {
    id: string;
    productId: string;
    /** Resolved product name from batch lookup in controller. Null if product was deleted. */
    productName: string | null;
    businessId: string;
    changeType: InventoryAction;
    quantityChange: number;
    quantityBefore: number;
    quantityAfter: number;
    referenceId: string | null;
    referenceType: string | null;
    reason: string | null;
    performedBy: string | null;
    createdAt: string;
}

// ─── Stock Alerts ────────────────────────────────────────

export interface StockAlertItem {
    productId: string;
    productName: string;
    sku: string | null;
    currentStock: number;
    reorderPoint: number | null;
    status: string; // "LOW_STOCK" | "OUT_OF_STOCK" | "REORDER_NEEDED"
}

export interface StockAlertReport {
    lowStockCount: number;
    outOfStockCount: number;
    reorderNeededCount: number;
    items: StockAlertItem[];
}

// ─── Inventory Summary ───────────────────────────────────

export interface InventorySummary {
    action: InventoryAction;
    count: number;
    totalQuantity: number;
    totalValue: number;
}

// ─── Stock History ───────────────────────────────────────

export interface StockHistoryEntry {
    timestamp: string;
    action: InventoryAction;
    quantityChange: number;
    quantityAfter: number;
    reference: string | null;
    reason: string | null;
}

// ─── Requests ────────────────────────────────────────────

export interface InventoryAdjustmentRequest {
    productId: string;
    quantity: number;
    reason: string;
    action: "RESTOCK" | "ADJUSTMENT";
}

// ─── Paged Response ──────────────────────────────────────

export interface PagedInventoryLogs {
    content: InventoryLog[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
}
