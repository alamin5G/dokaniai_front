/**
 * Due Management Types — বাকী খাতা (Due Ledger)
 * Aligned with backend: DueTransactionController, CustomerController
 * SRS Reference: Section 6.7 - Due Management
 */

// ─── Enums ───────────────────────────────────────────────

export type DueTransactionType = "BAKI" | "JOMA" | "RETURN" | "ADJUSTMENT";

export type ReferenceType = "SALE" | "SALE_RETURN" | "DISCOUNT" | "MANUAL" | "PAYMENT" | "MFS_SMS";

export type EntryMode = "MANUAL" | "VOICE" | "AI_PARSED" | "IMPORTED" | "AUTO_MFS";

export type PaymentMethod = "CASH" | "BKASH" | "NAGAD" | "ROCKET" | "BANK_TRANSFER" | "OTHER";

export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

// ─── Due Transaction ─────────────────────────────────────

export interface DueTransaction {
    id: string;
    businessId: string;
    customerId: string;
    type: DueTransactionType;
    amount: number;
    previousBalance: number;
    runningBalance: number;
    description: string | null;
    referenceId: string | null;
    referenceType: ReferenceType | null;
    paymentMethod: PaymentMethod | null;
    recordedVia: EntryMode;
    createdBy: string;
    date: string;
    createdAt: string;
}

// ─── Due Transaction Request ─────────────────────────────

export interface DueTransactionRequest {
    businessId?: string;
    customerId: string;
    type: DueTransactionType;
    amount: number;
    description?: string;
    paymentMethod?: string;
    recordedVia?: EntryMode;
    referenceId?: string;
    referenceType?: string;
}

// ─── Customer ────────────────────────────────────────────

export interface CustomerResponse {
    id: string;
    businessId: string;
    name: string;
    phone: string | null;
    address: string | null;
    runningBalance: number;
    creditLimit: number | null;
    lastTransactionAt: string | null;
    lastPaymentAt: string | null;
    status: UserStatus;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface CustomerCreateRequest {
    name: string;
    phone?: string;
    address?: string;
    creditLimit?: number;
}

export interface CustomerUpdateRequest {
    name?: string;
    phone?: string;
    address?: string;
    creditLimit?: number;
    status?: UserStatus;
}

// ─── Due Summary ─────────────────────────────────────────

export interface CustomerDueSummary {
    customerId: string;
    customerName: string;
    customerPhone?: string | null;
    customerAddress?: string | null;
    currentBalance: number;
    creditLimit: number | null;
    totalBakiCount: number;
    totalJomaCount: number;
    totalBakiAmount: number;
    totalJomaAmount: number;
    lastTransactionDate: string | null;
    lastPaymentDate: string | null;
    lastReminderSentAt?: string | null;
}

export interface CustomerDueItem {
    customerId: string;
    customerName: string;
    phone: string | null;
    dueAmount: number;
    lastTransactionDate: string | null;
}

// ─── Due Ledger ──────────────────────────────────────────

export interface DueLedgerResponse {
    customerId: string;
    customerName: string;
    currentBalance: number;
    creditLimit: number | null;
    transactions: DueTransaction[];
    totalTransactions: number;
}

// ─── Unified Customer Ledger ─────────────────────────────

export interface CustomerLedgerEntry {
    id: string;
    type: "SALE" | "BAKI" | "JOMA" | "ADJUSTMENT" | "RETURN" | "UNKNOWN";
    invoiceNumber: string | null;
    amount: number;
    balanceAfter: number | null;
    paymentMethod: string | null;
    paymentStatus: string | null; // PAID, DUE, PARTIAL — only for SALE
    description: string | null;
    date: string;
    referenceType: string | null;
    referenceId: string | null;
}

// ─── Unified Customer History ────────────────────────────

export interface HistoryEntry {
    type: "CASH_PURCHASE" | "CREDIT_PURCHASE" | "PAYMENT" | "ADJUSTMENT";
    referenceId: string;
    invoiceNumber: string | null;
    amount: number;
    description: string | null;
    paymentMethod: string | null;
    paymentStatus: string | null;
    balanceAfter: number | null;
    date: string;
}

export interface CustomerUnifiedHistory {
    customerId: string;
    name: string;
    phone: string | null;
    address: string | null;
    runningBalance: number;
    totalPurchased: number;
    totalPaid: number;
    timeline: HistoryEntry[];
}

// ─── Aged Dues ───────────────────────────────────────────

export interface AgedDueItem {
    customerId: string;
    customerName: string;
    totalDue: number;
    days0to30: number;
    days31to60: number;
    days61to90: number;
    over90Days: number;
}

export interface AgedDuesResponse {
    currentTotal: number;
    days0to30: number;
    days31to60: number;
    days61to90: number;
    over90Days: number;
    items: AgedDueItem[];
}

// ─── WhatsApp ────────────────────────────────────────────

export interface WhatsAppLink {
    customerId: string;
    customerName: string;
    phone: string | null;
    link: string;
    message: string;
    encodedMessage: string;
}

export interface WhatsAppReminderResponse {
    reminderId: string | null;
    customerId: string;
    businessId: string;
    customerName: string;
    phone: string | null;
    link: string;
    message: string;
    contextType: string | null;
    status: string;
    alreadySentToday: boolean;
    aiGenerated: boolean;
    resetAt: string | null;
}

// ─── Paged Response ──────────────────────────────────────

export interface PagedDueTransactions {
    content: DueTransaction[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
}

export interface PagedCustomers {
    content: CustomerResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
}
