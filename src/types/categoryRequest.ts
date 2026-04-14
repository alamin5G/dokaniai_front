export type CategoryRequestDecisionAction =
  | 'APPROVE_GLOBAL'
  | 'APPROVE_BUSINESS'
  | 'MERGE'
  | 'REJECT';

export type CategoryRequestStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED_GLOBAL'
  | 'APPROVED_BUSINESS'
  | 'REJECTED'
  | 'CANCELLED'
  | 'DUPLICATE_SUGGESTED';

export type SimilarityDetectionMethod = 'EXACT' | 'TEXT_MATCH' | 'AI_SEMANTIC';

export interface SimilarCategoryResult {
  categoryId: string;
  nameBn: string;
  nameEn: string | null;
  scope: 'GLOBAL' | 'BUSINESS';
  businessId: string | null;
  similarityScore: number;
  detectionMethod: SimilarityDetectionMethod;
  reason: string;
}

export interface CategoryRequestResponse {
  id: string;
  businessId: string;
  businessName: string | null;
  requestedBy: string;
  requestedByName: string | null;
  businessType: string | null;
  nameBn: string;
  nameEn: string | null;
  description: string | null;
  justification: string | null;
  status: CategoryRequestStatus;
  requestedScope: 'GLOBAL' | 'BUSINESS' | null;
  approvedScope: 'GLOBAL' | 'BUSINESS' | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
  mergedIntoCategoryId: string | null;
  createdCategoryId: string | null;
  createdAt: string;
  updatedAt: string;
  // AI Similarity Analysis
  aiSimilarityCheck: boolean | null;
  aiRecommendation: string | null;
  aiReasoning: string | null;
  similarCategories: SimilarCategoryResult[] | null;
}

export interface CategoryRequestDecisionPayload {
  requestId?: string;
  action: CategoryRequestDecisionAction;
  approvedScope?: 'GLOBAL' | 'BUSINESS';
  reviewNotes?: string;
  suggestedCategoryId?: string;
  rejectionReason?: string;
}
