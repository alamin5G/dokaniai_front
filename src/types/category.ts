export interface CategoryResponse {
  id: string;
  parentId: string | null;
  nameBn: string;
  nameEn: string | null;
  slug: string;
  scope: 'GLOBAL' | 'BUSINESS';
  businessType: string | null;
  businessId: string | null;
  createdBy: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

