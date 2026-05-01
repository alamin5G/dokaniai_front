/**
 * Invoice text formatting & WhatsApp deep-link generation.
 * Used by Cash/Credit sale success modals for instant invoice sharing.
 */

import type { CartItem, SaleCreatedResponse } from "@/types/sale";

export interface InvoiceBusinessInfo {
    name: string;
    phone?: string | null;
    whatsappNumber?: string | null;
    email?: string | null;
    contactPerson?: string | null;
    description?: string | null;
    website?: string | null;
    facebookPage?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    postalCode?: string | null;
    country?: string | null;
    receiptFooter?: string | null;
    invoiceNotes?: string | null;
}

const tk = (n: number) =>
    `৳ ${n.toLocaleString("bn-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/**
 * Format a sale as a readable Bengali text invoice for WhatsApp sharing.
 */
export function formatInvoiceText(
    sale: SaleCreatedResponse,
    cartItems: CartItem[],
    business: InvoiceBusinessInfo,
): string {
    const lines: string[] = [];

    // Header — shop info
    lines.push(`🧾 ${business.name || "DokaniAI ইনভয়েস"}`);
    if (business.description) lines.push(business.description);
    if (business.phone) lines.push(`📞 ${business.phone}`);
    if (business.whatsappNumber) lines.push(`💬 ${business.whatsappNumber}`);
    if (business.email) lines.push(`📧 ${business.email}`);
    if (business.contactPerson) lines.push(`👤 ${business.contactPerson}`);
    // Build full address conditionally
    const addressParts = [business.address, business.city, business.district, business.postalCode, business.country].filter(Boolean);
    if (addressParts.length > 0) lines.push(`📍 ${addressParts.join(", ")}`);
    if (business.website) lines.push(`🌐 ${business.website}`);
    if (business.facebookPage) lines.push(`📘 ${business.facebookPage}`);
    lines.push("────────────────────");

    // Invoice meta
    lines.push(`ইনভয়েস: ${sale.invoiceNumber}`);
    const now = new Date();
    lines.push(`তারিখ: ${now.toLocaleDateString("bn-BD")}`);

    // Customer info
    if (sale.customerName) {
        lines.push(`ক্রেতা: ${sale.customerName}`);
        if (sale.customerPhone) lines.push(`📞 ${sale.customerPhone}`);
        if (sale.customerAddress) lines.push(`📍 ${sale.customerAddress}`);
    }

    lines.push("────────────────────");

    // Items
    if (cartItems.length > 0) {
        lines.push("পণ্য          পরিমাণ    মূল্য");
        for (const item of cartItems) {
            const name = item.productName.length > 12
                ? item.productName.slice(0, 12) + "…"
                : item.productName;
            const qty = `${item.quantity} ${item.unit || "টি"}`;
            lines.push(`${name}   ${qty}   ${tk(item.unitPrice * item.quantity)}`);
        }
        lines.push("────────────────────");
    }

    // Totals
    lines.push(`সাবটোটাল: ${tk(sale.subtotal)}`);
    if (sale.totalDiscount > 0) {
        lines.push(`ডিসকাউন্ট: −${tk(sale.totalDiscount)}`);
    }
    lines.push(`মোট: ${tk(sale.totalAmount)}`);

    // Payment breakdown
    const isCredit = sale.paymentMethod === "CREDIT";
    const amountPaid = sale.amountPaid ?? 0;
    const amountDue = sale.amountDue ?? 0;

    if (isCredit && amountPaid > 0) {
        lines.push(`জমা: ${tk(amountPaid)} (নগদ)`);
        lines.push(`এই বাকী: ${tk(sale.dueAmount ?? amountDue)}`);
    } else if (isCredit) {
        lines.push(`এই বাকী: ${tk(sale.dueAmount ?? amountDue)}`);
    } else {
        lines.push(`পরিশোধ: নগদ ${tk(amountPaid > 0 ? amountPaid : sale.totalAmount)} ✅`);
    }

    // Show total due for credit sales
    const runningBal = sale.runningBalance ?? 0;
    const thisDue = sale.dueAmount ?? amountDue ?? 0;
    if (isCredit && runningBal > thisDue) {
        lines.push(`আগের বাকী: ${tk(runningBal - thisDue)}`);
        lines.push(`সর্বমোট বাকী: ${tk(runningBal)}`);
    } else if (isCredit && runningBal > 0 && runningBal === thisDue) {
        lines.push(`মোট বাকী: ${tk(runningBal)}`);
    } else if (isCredit) {
        lines.push(`মোট বাকী: ${tk(thisDue)}`);
    }

    // Invoice note
    if (business.invoiceNotes) {
        lines.push(`📝 ${business.invoiceNotes}`);
    }

    // Footer
    lines.push("────────────────────");
    lines.push("ধন্যবাদ! আবার আসুন 🙏");
    if (business.receiptFooter) {
        lines.push(business.receiptFooter);
    }

    return lines.join("\n");
}

/**
 * Build a WhatsApp deep-link for sharing an invoice.
 * If customerPhone is provided, opens directly to that contact's chat.
 * Otherwise opens WhatsApp with just the text (shop owner picks contact).
 */
export function buildWhatsAppInvoiceLink(
    invoiceText: string,
    customerPhone?: string | null,
): string {
    const encoded = encodeURIComponent(invoiceText);
    if (customerPhone) {
        // Strip non-digit chars, ensure country code
        const digits = customerPhone.replace(/\D/g, "");
        const phone = digits.startsWith("880") ? digits : digits.startsWith("0") ? `880${digits.slice(1)}` : digits;
        return `https://wa.me/${phone}?text=${encoded}`;
    }
    return `https://wa.me/?text=${encoded}`;
}

/**
 * Build the PDF download URL for a sale invoice.
 * Uses NEXT_PUBLIC_API_URL to point directly at the backend,
 * so the browser downloads from the correct server (not Next.js dev server).
 */
export function buildInvoicePdfUrl(businessId: string, saleId: string): string {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082/api/v1";
    return `${base}/businesses/${businessId}/sales/${saleId}/invoice`;
}
