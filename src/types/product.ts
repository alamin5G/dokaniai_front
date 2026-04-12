export type ProductStatus = 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ARCHIVED';

export interface Product {
  id: string;
  businessId: string;
  categoryId: string | null;
  subCategoryId: string | null;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  unit: string;
  costPrice: number;
  sellPrice: number;
  stockQty: number;
  reorderPoint: number | null;
  status: ProductStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProductListResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ProductCreateRequest {
  name: string;
  sku?: string;
  barcode?: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  stockQty?: number;
  reorderPoint?: number;
  categoryId?: string | null;
  subCategoryId?: string | null;
  description?: string;
}

export interface ProductUpdateRequest {
  name?: string;
  unit?: string;
  costPrice?: number;
  sellPrice?: number;
  reorderPoint?: number;
  categoryId?: string | null;
  subCategoryId?: string | null;
  description?: string;
}

export interface ProductStatsResponse {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  archivedProducts: number;
  totalInventoryValue: number;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: string[];
}
