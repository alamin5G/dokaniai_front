import apiClient from '@/lib/api';
import type {
  ImportResult,
  Product,
  ProductCreateRequest,
  ProductListResponse,
  ProductStatsResponse,
  ProductStatus,
  ProductUpdateRequest,
} from '@/types/product';

interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

function unwrap<T>(response: { data: ApiSuccess<T> }): T {
  return response.data.data;
}

export interface ListProductsParams {
  page?: number;
  size?: number;
  search?: string;
  status?: ProductStatus;
  category?: string;
}

export async function listProducts(
  businessId: string,
  params: ListProductsParams = {},
): Promise<ProductListResponse> {
  const response = await apiClient.get<ApiSuccess<ProductListResponse>>(
    `/businesses/${businessId}/products`,
    { params },
  );
  return unwrap(response);
}

export async function createProduct(
  businessId: string,
  data: ProductCreateRequest,
): Promise<Product> {
  const response = await apiClient.post<ApiSuccess<Product>>(
    `/businesses/${businessId}/products`,
    data,
  );
  return unwrap(response);
}

export async function getProduct(
  businessId: string,
  productId: string,
): Promise<Product> {
  const response = await apiClient.get<ApiSuccess<Product>>(
    `/businesses/${businessId}/products/${productId}`,
  );
  return unwrap(response);
}

export async function updateProduct(
  businessId: string,
  productId: string,
  data: ProductUpdateRequest,
): Promise<Product> {
  const response = await apiClient.put<ApiSuccess<Product>>(
    `/businesses/${businessId}/products/${productId}`,
    data,
  );
  return unwrap(response);
}

export async function archiveProduct(
  businessId: string,
  productId: string,
): Promise<void> {
  await apiClient.delete(`/businesses/${businessId}/products/${productId}`);
}

export async function getLowStockProducts(businessId: string): Promise<Product[]> {
  const response = await apiClient.get<ApiSuccess<Product[]>>(
    `/businesses/${businessId}/products/low-stock`,
  );
  return unwrap(response);
}

export async function getReorderNeededProducts(businessId: string): Promise<Product[]> {
  const response = await apiClient.get<ApiSuccess<Product[]>>(
    `/businesses/${businessId}/products/reorder-needed`,
  );
  return unwrap(response);
}

export async function getProductStats(
  businessId: string,
): Promise<ProductStatsResponse> {
  const response = await apiClient.get<ApiSuccess<ProductStatsResponse>>(
    `/businesses/${businessId}/products/stats`,
  );
  return unwrap(response);
}

export async function importProductsCsv(
  businessId: string,
  file: File,
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ApiSuccess<ImportResult>>(
    `/businesses/${businessId}/products/import`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return unwrap(response);
}

export async function downloadProductImportTemplate(
  businessId: string,
): Promise<Blob> {
  const response = await apiClient.get(
    `/businesses/${businessId}/products/import/template`,
    {
      responseType: 'blob',
    },
  );
  return response.data as Blob;
}

export async function exportProductsCsv(businessId: string): Promise<Blob> {
  const response = await apiClient.get(
    `/businesses/${businessId}/products/export`,
    {
      responseType: 'blob',
    },
  );
  return response.data as Blob;
}
