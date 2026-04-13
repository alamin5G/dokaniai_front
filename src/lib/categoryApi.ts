import apiClient from '@/lib/api';
import type { CategoryResponse } from '@/types/category';

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
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

