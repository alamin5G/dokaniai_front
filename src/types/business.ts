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

/** Mirrors com.dokaniai.enums.PaymentMethod */
export type PaymentMethod =
  | 'CASH'
  | 'CREDIT'
  | 'BKASH'
  | 'NAGAD'
  | 'ROCKET'
  | 'CARD'
  | 'BANK'
  | 'MANUAL';

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
  paymentChannel?: PaymentMethod;
  paymentReceiverNumber?: string;
  aiAssistantEnabled?: boolean;
  invoicePrefix?: string;
  invoiceNotes?: string;
  receiptFooter?: string;
  lowStockThreshold?: number;
  lowStockAlertEnabled?: boolean;
}

export interface OperatingHoursRequest {
  operatingHoursStart?: string;
  operatingHoursEnd?: string;
  is24Hours: boolean;
  operatingDays: number[];
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
  timezone?: string;
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

export interface BusinessOptionResponse {
  id: string;
  name: string;
  type: string;
  status: string;
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
  taxRate: number | null;
  taxNumber: string | null;
  paymentChannel: PaymentMethod | null;
  paymentReceiverNumber: string | null;
  aiAssistantEnabled: boolean;
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
  address: string | null;
  city: string | null;
  district: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
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

/** Response shape for GET /businesses/onboarding/my-status */
export interface OnboardingMyStatusResponse {
  hasBusinesses: boolean;
  hasActiveBusinesses: boolean;
  hasCompletedOnboarding: boolean;
  incompleteBusinessId: string | null;
}

/** Response shape for GET /businesses/types/options */
export interface BusinessTypeOptionResponse {
  value: string;
  displayNameEn: string;
  displayNameBn: string;
}
