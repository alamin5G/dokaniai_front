/**
 * Vendor Management API Client
 * Aligned with backend: VendorController
 */
import apiClient from "@/lib/api";
import type { Vendor, VendorRequest } from "@/types/vendor";

interface ApiSuccess<T> {
    success: boolean;
    data: T;
    message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
    return response.data.data;
}

/** List all vendors for a business */
export async function listVendors(businessId: string): Promise<Vendor[]> {
    const response = await apiClient.get<ApiSuccess<Vendor[]>>(
        `/businesses/${businessId}/vendors`,
    );
    return unwrap(response);
}

/** Get a single vendor */
export async function getVendor(businessId: string, vendorId: string): Promise<Vendor> {
    const response = await apiClient.get<ApiSuccess<Vendor>>(
        `/businesses/${businessId}/vendors/${vendorId}`,
    );
    return unwrap(response);
}

/** Create a new vendor */
export async function createVendor(
    businessId: string,
    data: VendorRequest,
): Promise<Vendor> {
    const response = await apiClient.post<ApiSuccess<Vendor>>(
        `/businesses/${businessId}/vendors`,
        data,
    );
    return unwrap(response);
}

/** Update an existing vendor */
export async function updateVendor(
    businessId: string,
    vendorId: string,
    data: VendorRequest,
): Promise<Vendor> {
    const response = await apiClient.put<ApiSuccess<Vendor>>(
        `/businesses/${businessId}/vendors/${vendorId}`,
        data,
    );
    return unwrap(response);
}

/** Delete a vendor */
export async function deleteVendor(
    businessId: string,
    vendorId: string,
): Promise<void> {
    await apiClient.delete(
        `/businesses/${businessId}/vendors/${vendorId}`,
    );
}

/** Toggle vendor active/inactive */
export async function toggleVendorActive(
    businessId: string,
    vendorId: string,
): Promise<Vendor> {
    const response = await apiClient.patch<ApiSuccess<Vendor>>(
        `/businesses/${businessId}/vendors/${vendorId}/toggle-active`,
    );
    return unwrap(response);
}