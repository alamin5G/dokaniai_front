import apiClient from '@/lib/api';
import type { CategoryResponse } from '@/types/category';
import type {
  CategoryRequestCreatePayload,
  CategoryRequestDecisionPayload,
  CategoryRequestDecisionResult,
  CategoryRequestResponse,
  CategoryRequestStats,
  CategoryRequestStatus,
  CategoryRequestSubmitResult,
} from '@/types/categoryRequest';

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface Paged<T> {
  content: T[];
  number: number;
  last: boolean;
  totalElements?: number;
  totalPages?: number;
}

export interface SearchCategoryPage {
  content: CategoryResponse[];
  number: number;
  last: boolean;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
  return response.data.data;
}

export async function getCategoriesByBusinessType(businessType: string): Promise<CategoryResponse[]> {
  const response = await apiClient.get<ApiSuccess<CategoryResponse[]>>(
    `/categories/by-business-type/${encodeURIComponent(businessType)}`,
  );
  return unwrap(response);
}

export async function getCategoryTree(businessType?: string): Promise<CategoryResponse[]> {
  const params = businessType ? `?businessType=${encodeURIComponent(businessType)}` : '';
  const response = await apiClient.get<ApiSuccess<CategoryResponse[]>>(
    `/categories/tree${params}`,
  );
  return unwrap(response);
}

export async function searchCategoriesByBusinessType(
  businessType: string,
  q: string,
  page = 0,
  size = 50,
): Promise<SearchCategoryPage> {
  const response = await apiClient.get<ApiSuccess<Paged<CategoryResponse>>>(
    `/categories/search/by-business-type?businessType=${encodeURIComponent(businessType)}&q=${encodeURIComponent(q)}&page=${page}&size=${size}`,
  );
  return response.data.data;
}

export async function getPendingCategoryRequests(page = 0, size = 20): Promise<{ content: CategoryRequestResponse[]; totalPages: number }> {
  const response = await apiClient.get<ApiSuccess<Paged<CategoryRequestResponse>>>(
    `/category-requests/pending?page=${page}&size=${size}`,
  );
  const data = response.data.data;
  return { content: data.content, totalPages: data.totalPages ?? (data.last ? data.number + 1 : data.number + 2) };
}

export async function getCategoryRequestsByStatus(
  status: CategoryRequestStatus,
  page = 0,
  size = 20,
): Promise<{ content: CategoryRequestResponse[]; totalPages: number }> {
  const response = await apiClient.get<ApiSuccess<Paged<CategoryRequestResponse>>>(
    `/category-requests/status/${status}?page=${page}&size=${size}`,
  );
  const data = response.data.data;
  return { content: data.content, totalPages: data.totalPages ?? (data.last ? data.number + 1 : data.number + 2) };
}

export async function getCategoryRequestStats(): Promise<CategoryRequestStats> {
  const response = await apiClient.get<ApiSuccess<CategoryRequestStats>>(
    `/category-requests/stats`,
  );
  return unwrap(response);
}

export async function decideCategoryRequest(
  requestId: string,
  payload: CategoryRequestDecisionPayload,
): Promise<CategoryRequestDecisionResult> {
  const response = await apiClient.post<ApiSuccess<CategoryRequestDecisionResult>>(
    `/category-requests/${encodeURIComponent(requestId)}/decision`,
    payload,
  );
  return response.data.data;
}

export async function startReviewCategoryRequest(requestId: string): Promise<void> {
  await apiClient.post(`/category-requests/${encodeURIComponent(requestId)}/review`);
}

export async function createGlobalCategory(payload: {
  nameBn: string;
  nameEn?: string;
  businessType: string;
  parentId?: string;
  scope: 'GLOBAL' | 'BUSINESS';
  description?: string;
}): Promise<CategoryResponse> {
  const body: Record<string, unknown> = {
    nameBn: payload.nameBn,
    nameEn: payload.nameEn || null,
    slug: payload.nameBn.trim().toLowerCase().replace(/\s+/g, '-').substring(0, 50),
    scope: payload.scope,
    businessType: payload.businessType,
    parentId: payload.parentId || null,
  };
  const response = await apiClient.post<ApiSuccess<CategoryResponse>>(
    `/categories`,
    body,
  );
  return unwrap(response);
}

export async function updateCategory(
  categoryId: string,
  payload: { nameBn?: string; nameEn?: string; description?: string },
): Promise<CategoryResponse> {
  const response = await apiClient.put<ApiSuccess<CategoryResponse>>(
    `/categories/${encodeURIComponent(categoryId)}`,
    payload,
  );
  return unwrap(response);
}

export async function deactivateCategory(categoryId: string): Promise<void> {
  await apiClient.delete(`/categories/${encodeURIComponent(categoryId)}`);
}

export async function submitCategoryRequest(
  businessId: string,
  payload: CategoryRequestCreatePayload,
): Promise<CategoryRequestSubmitResult> {
  const response = await apiClient.post<ApiSuccess<CategoryRequestSubmitResult>>(
    `/category-requests?businessId=${encodeURIComponent(businessId)}`,
    payload,
  );
  return response.data.data;
}

export async function confirmCategoryRequest(requestId: string): Promise<CategoryRequestSubmitResult> {
  const response = await apiClient.post<ApiSuccess<CategoryRequestSubmitResult>>(
    `/category-requests/${encodeURIComponent(requestId)}/confirm`,
  );
  return response.data.data;
}

export async function cancelCategoryRequest(requestId: string): Promise<void> {
  await apiClient.delete(`/category-requests/${encodeURIComponent(requestId)}`);
}

export async function getMyCategoryRequests(): Promise<CategoryRequestResponse[]> {
  const response = await apiClient.get<ApiSuccess<CategoryRequestResponse[]>>(
    `/category-requests/my-requests`,
  );
  return unwrap(response);
}

export async function getBusinessCategoryRequests(businessId: string): Promise<CategoryRequestResponse[]> {
  const response = await apiClient.get<ApiSuccess<CategoryRequestResponse[]>>(
    `/category-requests/business/${encodeURIComponent(businessId)}`,
  );
  return unwrap(response);
}

export async function getCategoryRequestById(requestId: string): Promise<CategoryRequestResponse> {
  const response = await apiClient.get<ApiSuccess<CategoryRequestResponse>>(
    `/category-requests/${encodeURIComponent(requestId)}`,
  );
  return unwrap(response);
}
