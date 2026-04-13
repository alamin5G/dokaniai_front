/**
 * Business API Service Functions
 *
 * All functions use apiClient from src/lib/api.ts.
 * Endpoints match BusinessController.java exactly.
 * Responses are unwrapped from the ApiResponse<T> wrapper ({ success, data, message }).
 */

import apiClient from '@/lib/api';
import type {
  BusinessCreateRequest,
  BusinessListResponse,
  BusinessLocationRequest,
  BusinessLocationResponse,
  BusinessOnboardingResponse,
  OperatingHoursRequest,
  BusinessProfileRequest,
  BusinessProfileResponse,
  BusinessResponse,
  BusinessSettingsRequest,
  BusinessSettingsResponse,
  BusinessStatsResponse,
  BusinessUpdateRequest,
  OnboardingMyStatusResponse,
  OnboardingStatsResponse,
  BusinessTypeOptionResponse,
} from '@/types/business';

// ---------------------------------------------------------------------------
// Helper — unwrap the standard ApiResponse envelope
// ---------------------------------------------------------------------------

/** Shape of every successful API response */
interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Business CRUD
// ---------------------------------------------------------------------------

/** GET /businesses — list user's businesses */
export async function listBusinesses(): Promise<BusinessListResponse> {
  const response = await apiClient.get<ApiSuccess<BusinessListResponse>>('/businesses');
  return unwrap(response);
}

/** GET /businesses/{businessId} — get single business */
export async function getBusiness(businessId: string): Promise<BusinessResponse> {
  const response = await apiClient.get<ApiSuccess<BusinessResponse>>(`/businesses/${businessId}`);
  return unwrap(response);
}

/** POST /businesses — create a new business */
export async function createBusiness(data: BusinessCreateRequest): Promise<BusinessResponse> {
  const response = await apiClient.post<ApiSuccess<BusinessResponse>>('/businesses', data);
  return unwrap(response);
}

/** PUT /businesses/{businessId} — update a business */
export async function updateBusiness(
  businessId: string,
  data: BusinessUpdateRequest,
): Promise<BusinessResponse> {
  const response = await apiClient.put<ApiSuccess<BusinessResponse>>(
    `/businesses/${businessId}`,
    data,
  );
  return unwrap(response);
}

/** POST /businesses/{businessId}/archive — archive a business */
export async function archiveBusiness(businessId: string): Promise<void> {
  await apiClient.post(`/businesses/${businessId}/archive`);
}

/** DELETE /businesses/{businessId} — permanently delete a business */
export async function deleteBusiness(businessId: string): Promise<void> {
  await apiClient.delete(`/businesses/${businessId}`);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/** GET /businesses/{businessId}/stats */
export async function getBusinessStats(businessId: string): Promise<BusinessStatsResponse> {
  const response = await apiClient.get<ApiSuccess<BusinessStatsResponse>>(
    `/businesses/${businessId}/stats`,
  );
  return unwrap(response);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** GET /businesses/{businessId}/settings */
export async function getBusinessSettings(
  businessId: string,
): Promise<BusinessSettingsResponse> {
  const response = await apiClient.get<ApiSuccess<BusinessSettingsResponse>>(
    `/businesses/${businessId}/settings`,
  );
  return unwrap(response);
}

/** PUT /businesses/{businessId}/settings */
export async function updateBusinessSettings(
  businessId: string,
  data: BusinessSettingsRequest,
): Promise<void> {
  await apiClient.put(`/businesses/${businessId}/settings`, data);
}

/** PUT /businesses/{businessId}/operating-hours */
export async function updateBusinessOperatingHours(
  businessId: string,
  data: OperatingHoursRequest,
): Promise<void> {
  await apiClient.put(`/businesses/${businessId}/operating-hours`, data);
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** GET /businesses/{businessId}/profile */
export async function getBusinessProfile(businessId: string): Promise<BusinessProfileResponse> {
  const response = await apiClient.get<ApiSuccess<BusinessProfileResponse>>(
    `/businesses/${businessId}/profile`,
  );
  return unwrap(response);
}

/** PUT /businesses/{businessId}/profile */
export async function updateBusinessProfile(
  businessId: string,
  data: BusinessProfileRequest,
): Promise<void> {
  await apiClient.put(`/businesses/${businessId}/profile`, data);
}

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

/** GET /businesses/{businessId}/location */
export async function getBusinessLocation(businessId: string): Promise<BusinessLocationResponse> {
  const response = await apiClient.get<ApiSuccess<BusinessLocationResponse>>(
    `/businesses/${businessId}/location`,
  );
  return unwrap(response);
}

/** PUT /businesses/{businessId}/location */
export async function updateBusinessLocation(
  businessId: string,
  data: BusinessLocationRequest,
): Promise<void> {
  await apiClient.put(`/businesses/${businessId}/location`, data);
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

/** GET /businesses/{businessId}/onboarding */
export async function getOnboarding(
  businessId: string,
): Promise<BusinessOnboardingResponse> {
  const response = await apiClient.get<ApiSuccess<BusinessOnboardingResponse>>(
    `/businesses/${businessId}/onboarding`,
  );
  return unwrap(response);
}

/** PATCH /businesses/{businessId}/onboarding/step?step=N */
export async function updateOnboardingStep(
  businessId: string,
  step: number,
): Promise<void> {
  await apiClient.patch(`/businesses/${businessId}/onboarding/step`, null, {
    params: { step },
  });
}

/** POST /businesses/{businessId}/onboarding/complete */
export async function completeOnboarding(businessId: string): Promise<void> {
  await apiClient.post(`/businesses/${businessId}/onboarding/complete`);
}

/** POST /businesses/{businessId}/onboarding/sample-data-loaded */
export async function markSampleDataLoaded(businessId: string): Promise<void> {
  await apiClient.post(`/businesses/${businessId}/onboarding/sample-data-loaded`);
}

/** GET /businesses/onboarding/incomplete?maxStep=N */
export async function listIncompleteOnboarding(
  maxStep?: number,
): Promise<BusinessOnboardingResponse[]> {
  const response = await apiClient.get<ApiSuccess<BusinessOnboardingResponse[]>>(
    '/businesses/onboarding/incomplete',
    { params: maxStep != null ? { maxStep } : undefined },
  );
  return unwrap(response);
}

/** GET /businesses/onboarding/stats */
export async function getOnboardingStats(): Promise<OnboardingStatsResponse> {
  const response = await apiClient.get<ApiSuccess<OnboardingStatsResponse>>(
    '/businesses/onboarding/stats',
  );
  return unwrap(response);
}

/** GET /businesses/onboarding/my-status */
export async function getMyOnboardingStatus(): Promise<OnboardingMyStatusResponse> {
  const response = await apiClient.get<ApiSuccess<OnboardingMyStatusResponse>>(
    '/businesses/onboarding/my-status',
  );
  return unwrap(response);
}

/** GET /businesses/types/options */
export async function listBusinessTypeOptions(): Promise<BusinessTypeOptionResponse[]> {
  const response = await apiClient.get<ApiSuccess<BusinessTypeOptionResponse[]>>('/businesses/types/options');
  return unwrap(response);
}
