import apiClient from '@/lib/api';
import type { CategoryResponse } from '@/types/category';
import type {
  CategoryRequestDecisionPayload,
  CategoryRequestResponse,
} from '@/types/categoryRequest';

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface Paged<T> {
  content: T[];
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

export async function getPendingCategoryRequests(page = 0, size = 20): Promise<CategoryRequestResponse[]> {
  const response = await apiClient.get<ApiSuccess<Paged<CategoryRequestResponse>>>(
    `/category-requests/pending?page=${page}&size=${size}`,
  );
  return response.data.data.content;
}

export async function decideCategoryRequest(
  requestId: string,
  payload: CategoryRequestDecisionPayload,
): Promise<void> {
  await apiClient.post(`/category-requests/${encodeURIComponent(requestId)}/decision`, payload);
}

