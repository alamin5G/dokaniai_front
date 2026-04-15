/**
 * Data Export API Client
 * Aligned with backend: DataExportController
 * SRS Reference: Section 5.2.3 — Data Extraction Rights (FR-DATA-01)
 */

import apiClient from "@/lib/api";

// ─── Types ───────────────────────────────────────────────

export interface DataExportRequest {
    businessId: string;
    format: "CSV" | "JSON" | "ZIP";
    include: string[];
}

export interface ExportRequestResponse {
    exportId: string;
    status: string;
    message: string;
}

export interface ExportVerifyResponse {
    verified: boolean;
    downloadUrl: string;
    expiresAt: string;
}

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

// ─── API Functions ───────────────────────────────────────

/**
 * Request a data export for a business.
 * An OTP will be sent to the user's phone/email for verification.
 */
export async function requestDataExport(
    request: DataExportRequest
): Promise<ExportRequestResponse> {
    const response = await apiClient.post<ApiSuccess<ExportRequestResponse>>(
        "/data/export",
        request
    );
    return unwrap<ExportRequestResponse>(response);
}

/**
 * Verify OTP for a data export request.
 * Returns download URL upon successful verification.
 */
export async function verifyExportOtp(
    exportId: string,
    otp: string
): Promise<ExportVerifyResponse> {
    const response = await apiClient.post<ApiSuccess<ExportVerifyResponse>>(
        "/data/export/verify",
        { exportId, otp }
    );
    return unwrap<ExportVerifyResponse>(response);
}

/**
 * Download the exported data file after OTP verification.
 */
export async function downloadExport(exportId: string): Promise<Blob> {
    const response = await apiClient.get(
        `/data/export/${exportId}/download`,
        { responseType: "blob" }
    );
    return response.data as Blob;
}

/**
 * Get monthly export usage for the current user.
 * Returns [exportsUsedThisMonth, monthlyLimit].
 * If limit is -1, the user has unlimited exports (Plus/Enterprise).
 */
export async function getExportUsage(): Promise<[number, number]> {
    const response = await apiClient.get<ApiSuccess<[number, number]>>(
        "/data/export/usage"
    );
    return unwrap<[number, number]>(response);
}
