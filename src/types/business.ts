/**
 * Business-related TypeScript interfaces
 *
 * Field names match the backend Java DTOs exactly.
 * Source: C:/Users/alami/IdeaProjects/DokaniAI/src/main/java/com/dokaniai/dto/
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Mirrors com.dokaniai.enums.BusinessStatus */
export type BusinessStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

/** Mirrors BusinessCreateRequest.java */
export interface BusinessCreateRequest {
  name: string;
  type: string;
  description?: string;
  currency?: string;
}

/** Mirrors BusinessUpdateRequest.java */
export interface BusinessUpdateRequest {
  name?: string;
  type?: string;
  description?: string;
}

/** Mirrors BusinessSettingsRequest.java */
export interface BusinessSettingsRequest {
  currency?: string;
  taxEnabled?: boolean;
  taxRate?: number;
  taxNumber?: string;
  invoicePrefix?: string;
  lowStockThreshold?: number;
  lowStockAlertEnabled?: boolean;
}

/** Mirrors BusinessProfileRequest.java */
export interface BusinessProfileRequest {
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  contactPerson?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  website?: string;
  facebookPage?: string;
}

/** Mirrors BusinessLocationRequest.java */
export interface BusinessLocationRequest {
  address?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

/** Mirrors BusinessResponse.java */
export interface BusinessResponse {
  id: string;
  userId: string;
  name: string;
  slug: string;
  type: string;
  status: BusinessStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors BusinessStatsResponse.java */
export interface BusinessStatsResponse {
  totalProducts: number;
  totalSales: number;
  totalCustomers: number;
  totalRevenue: number;
  totalDue: number;
  activeCustomers: number;
  lowStockProducts: number;
}

/** Mirrors BusinessSettingsResponse.java */
export interface BusinessSettingsResponse {
  businessId: string;
  currency: string;
  operatingHoursStart: string | null;
  operatingHoursEnd: string | null;
  is24Hours: boolean;
  breakStart: string | null;
  breakEnd: string | null;
  operatingDays: number[];
  taxEnabled: boolean;
  taxRate: number;
  taxNumber: string;
  invoicePrefix: string;
  invoiceCounter: number;
  invoiceNotes: string;
  receiptFooter: string;
  lowStockThreshold: number;
  lowStockAlertEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors BusinessProfileResponse.java */
export interface BusinessProfileResponse {
  businessId: string;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  contactPerson: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  website: string;
  facebookPage: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors BusinessLocationResponse.java */
export interface BusinessLocationResponse {
  businessId: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

/** Mirrors BusinessOnboardingResponse.java */
export interface BusinessOnboardingResponse {
  businessId: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  setupStep: number;
  sampleDataLoaded: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors BusinessContextResponse.java */
export interface BusinessContextResponse {
  businessName: string;
  businessType: string;
  currency: string;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  customersWithDue: number;
  totalDueAmount: number;
  todaySales: number;
  monthSales: number;
  monthExpenses: number;
  recentActivity: string;
}

// ---------------------------------------------------------------------------
// Wrapper / Paginated Types
// ---------------------------------------------------------------------------

/** Response shape for GET /businesses */
export interface BusinessListResponse {
  businesses: BusinessResponse[];
  total: number;
}

/** Response shape for GET /businesses/onboarding/stats */
export interface OnboardingStatsResponse {
  completed: number;
  incomplete: number;
}
