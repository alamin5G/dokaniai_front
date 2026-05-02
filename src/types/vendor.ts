export interface Vendor {
    id: string;
    businessId: string;
    name: string;
    phone: string | null;
    address: string | null;
    notes: string | null;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export interface VendorRequest {
    name: string;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
    isActive?: boolean;
}

export interface VendorListResponse {
    content: Vendor[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}