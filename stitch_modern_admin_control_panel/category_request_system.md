# Category Request System - Implementation Summary

## Overview

This document summarizes the Category Request System implementation to prevent category explosion in the DokaniAI multi-tenant SaaS platform.

## Problem Solved

Without a request system, every business could create their own categories freely, leading to:

- Duplicate categories with slight name variations (বিস্কুট, বিস্কিট, Biscuit, কুকিজ)
- Database bloat with redundant data
- Inconsistent analytics and reporting

## Solution: Category Request + Approval Workflow

### Workflow

```
Business Owner requests category
        ↓
System checks for similar/exact matches
        ↓
If exact match → Suggest existing (auto-reject)
If similar exists → Show suggestions, still allow request
If unique → Create pending request
        ↓
Admin reviews pending requests
        ↓
Admin decides:
  - Approve as GLOBAL (available to all businesses)
  - Approve as BUSINESS (only for that business)
  - Suggest existing category instead
  - Reject with reason
        ↓
If approved → Category is created automatically
```

## Files Created

### 1. Enum: `CategoryRequestStatus.java`

**Path:** `backend-structure/java-src/com/dokaniai/enums/CategoryRequestStatus.java`

```java
public enum CategoryRequestStatus {
    PENDING,              // Waiting for admin review
    UNDER_REVIEW,         // Admin is reviewing
    APPROVED_GLOBAL,      // Approved as global category
    APPROVED_BUSINESS,    // Approved as business-specific category
    REJECTED,             // Rejected by admin
    CANCELLED,            // Cancelled by requester
    DUPLICATE_SUGGESTED   // Admin suggested existing category
}
```

### 2. Entity: `CategoryRequest.java`

**Path:** `backend-structure/java-src/com/dokaniai/entity/CategoryRequest.java`

Key fields:

- `businessId`, `requestedBy` - Who requested
- `nameBn`, `nameEn`, `description`, `justification` - Category details
- `status` - Current status
- `requestedScope`, `approvedScope` - Scope decisions
- `reviewedBy`, `reviewedAt`, `reviewNotes` - Admin review info
- `suggestedCategoryId` - If admin suggested existing
- `createdCategoryId` - Reference to created category

### 3. DTOs

**Request DTOs:**

- `CategoryRequestCreateRequest.java` - For submitting requests
- `CategoryRequestReviewRequest.java` - For admin review decisions

**Response DTOs:**

- `CategoryRequestResponse.java` - Full request details
- `CategoryRequestResult.java` - Result of submission (pending/suggestions/exact match)

### 4. Repository: `CategoryRequestRepository.java`

**Path:** `backend-structure/java-src/com/dokaniai/repository/CategoryRequestRepository.java`

Key methods:

- `findPendingRequests()` - For admin dashboard
- `existsPendingRequestForBusinessAndName()` - Prevent duplicate requests
- `searchRequests()` - Search functionality
- `countByStatus()` - Statistics

### 5. Service: `CategoryRequestService.java`

**Path:** `backend-structure/java-src/com/dokaniai/service/CategoryRequestService.java`

Key methods:

- `submitRequest()` - Submit new category request
- `confirmRequest()` - Confirm after seeing suggestions
- `cancelRequest()` - Cancel pending request
- `startReview()`, `approveRequest()`, `rejectRequest()` - Admin actions
- `suggestExistingCategory()` - Suggest existing instead

### 6. Service Impl: `CategoryRequestServiceImpl.java`

**Path:** `backend-structure/java-src/com/dokaniai/service/impl/CategoryRequestServiceImpl.java`

Full implementation with:

- Similar/exact match detection
- Automatic category creation on approval
- Notification-ready structure

## Files Updated

### 1. `CategoryService.java`

- Removed old `requestGlobalCategory()` and `approveCategoryRequest()` methods
- Added `findSimilarCategories()` and `findExactMatch()` helper methods
- Clarified that category creation is now through request approval only

### 2. `CategoryServiceImpl.java`

- Updated to work with CategoryRequestService
- Added similarity checking logic
- Improved slug generation

### 3. `CategoryRepository.java`

- Already had required methods (no changes needed)

### 4. `ProductRepository.java`

- Added `countByCategoryIdAndDeletedAtIsNull()` method

## Database Migration Required

Add this to your Flyway migration:

```sql
-- Category Requests Table
CREATE TABLE category_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
    -- Requester Info
    business_id UUID NOT NULL,
    requested_by UUID NOT NULL,
  
    -- Category Details
    name_bn VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    parent_id UUID,
    justification TEXT,
  
    -- Status & Scope
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    requested_scope VARCHAR(20),
    approved_scope VARCHAR(20),
  
    -- Review Info
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
  
    -- Suggestions
    suggested_category_id UUID,
    created_category_id UUID,
  
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
    -- Foreign Keys
    CONSTRAINT fk_category_request_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    CONSTRAINT fk_category_request_user FOREIGN KEY (requested_by) REFERENCES users(id),
    CONSTRAINT fk_category_request_parent FOREIGN KEY (parent_id) REFERENCES categories(id),
    CONSTRAINT fk_category_request_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id),
    CONSTRAINT fk_category_request_suggested FOREIGN KEY (suggested_category_id) REFERENCES categories(id),
    CONSTRAINT fk_category_request_created FOREIGN KEY (created_category_id) REFERENCES categories(id)
);

-- Indexes
CREATE INDEX idx_category_requests_business_id ON category_requests(business_id);
CREATE INDEX idx_category_requests_status ON category_requests(status);
CREATE INDEX idx_category_requests_created_at ON category_requests(created_at);

-- Add constraint for valid status values
ALTER TABLE category_requests ADD CONSTRAINT chk_category_request_status 
    CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED_GLOBAL', 'APPROVED_BUSINESS', 'REJECTED', 'CANCELLED', 'DUPLICATE_SUGGESTED'));
```

## API Endpoints (To be implemented in Controller)

### User Endpoints

```
POST   /api/businesses/{businessId}/category-requests     - Submit request
GET    /api/businesses/{businessId}/category-requests     - List business requests
DELETE /api/category-requests/{requestId}                 - Cancel request
```

### Admin Endpoints

```
GET    /api/admin/category-requests/pending               - List pending requests
PUT    /api/admin/category-requests/{requestId}/review    - Start review
PUT    /api/admin/category-requests/{requestId}/approve   - Approve request
PUT    /api/admin/category-requests/{requestId}/reject    - Reject request
PUT    /api/admin/category-requests/{requestId}/suggest   - Suggest existing
```

## Usage Example

### User submits request:

```java
CategoryRequestCreateRequest request = new CategoryRequestCreateRequest(
    "বিস্কুট",           // nameBn
    "Biscuit",          // nameEn  
    null,               // parentId
    "বিস্কুট বিক্রি হয়", // description
    "আমার দোকানে অনেক বিস্কুট বিক্রি হয়, তাই আলাদা ক্যাটাগরি লাগবে", // justification
    CategoryScope.GLOBAL // requestedScope (optional)
);

CategoryRequestResult result = categoryRequestService.submitRequest(businessId, userId, request);

if (result.status() == CategoryRequestStatus.PENDING) {
    // Request created, wait for admin
} else if (result.similarCategories() != null) {
    // Show suggestions to user, let them confirm
}
```

### Admin approves:

```java
CategoryRequestReviewRequest review = new CategoryRequestReviewRequest(
    requestId,
    CategoryScope.GLOBAL,  // approvedScope
    "Approved as global category for all grocery shops", // reviewNotes
    null,   // suggestedCategoryId
    false   // reject
);

String categoryId = categoryRequestService.approveRequest(requestId, adminId, review);
```

## Statistics

- `countPendingRequests()` - Number of pending requests
- `countRequestsByStatus(status)` - Count by specific status

## Moderation Update (New Requirement)

This project now uses an explicit admin decision action model for request moderation:

- `APPROVE_GLOBAL`
- `APPROVE_BUSINESS`
- `MERGE`
- `REJECT`

### Additional persisted fields

- `business_type` - requester business type snapshot (`GROCERY`, `FASHION`, etc.)
- `merged_into_category_id` - category target when admin merges
- `rejection_reason` - explicit reason shown to requester

### Current decision endpoint payload

`POST /api/v1/category-requests/{requestId}/decision`

```json
{
  "action": "MERGE",
  "suggestedCategoryId": "uuid",
  "reviewNotes": "Similar existing category already exists"
}
```

### Notification behavior

Requester receives an in-app notification on final moderation decision:

- Approved (GLOBAL/BUSINESS)
- Merged with existing category
- Rejected (with reason)



## 🤔 Options for Similarity Detection

| Approach                   | কীভাবে কাজ করে | Pros             | Cons                                           |
| -------------------------- | -------------------------- | ---------------- | ---------------------------------------------- |
| **Text Match**       | String similarity          | Fast, Free       | "স্পেশাল" vs "বিশেষ" ধরবে না |
| **Vector Embedding** | Semantic similarity        | Fast, Meaningful | Needs embedding model                          |
| **AI/LLM**           | Deep understanding         | Best accuracy    | Slower, costs tokens                           |

---

## ✅ আমার Recommendation: **Hybrid Approach**

```
┌─────────────────────────────────────────────────────────────────┐
│              SIMILARITY CHECK PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Text Similarity (Fast, Free)                          │
│  ├── Levenshtein distance                                       │
│  ├── Jaccard similarity                                         │
│  └── Exact match check                                          │
│       │                                                         │
│       ├── If score > 90% ──→ Return suggestion immediately     │
│       │                                                         │
│       └── If score < 90% ──→ Go to Step 2                      │
│                                                                  │
│  Step 2: AI Semantic Check (Meaningful)                        │
│  ├── Call GLM-4 / Gemini                                       │
│  ├── Check semantic meaning                                     │
│  └── Return similar categories with reasoning                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ AI-Based Similarity Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ USER SUBMITS: "স্পেশাল আইটেম"                                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ BACKEND: Similarity Check Service                                │
├──────────────────────────────────────────────────────────────────┤
│ 1. Get all categories for GROCERY type                          │
│ 2. Text similarity check (local)                                │
│ 3. If no strong match → Call AI                                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ AI PROMPT:                                                       │
├──────────────────────────────────────────────────────────────────┤
│ You are a category matching assistant for a Bengali shop system.│
│                                                                  │
│ New category request:                                            │
│ - Name (BN): "স্পেশাল আইটেম"                                     │
│ - Name (EN): "Special Items"                                    │
│ - Business Type: GROCERY                                        │
│                                                                  │
│ Existing categories in GROCERY:                                 │
│ 1. চাল-ডাল / Rice & Pulses                                      │
│ 2. তেল-ঘি / Oil & Ghee                                          │
│ 3. মসলা / Spices                                                │
│ 4. স্ন্যাকস / Snacks                                            │
│ 5. বিবিধ / Miscellaneous                                        │
│ 6. অন্যান্য / Others                                            │
│ ...                                                              │
│                                                                  │
│ Task: Check if any existing category is semantically similar.   │
│ Consider:                                                        │
│ - Same meaning in Bengali/English                               │
│ - Synonyms (বিশেষ = স্পেশাল)                                     │
│ - Overlapping purpose                                           │
│                                                                  │
│ Return JSON:                                                     │
│ {                                                                │
│   "similarCategories": [                                         │
│     {                                                            │
│       "categoryId": "cat_005",                                  │
│       "nameBn": "বিবিধ",                                         │
│       "nameEn": "Miscellaneous",                                │
│       "similarityScore": 0.85,                                  │
│       "reason": "Both represent special/miscellaneous items"    │
│     }                                                            │
│   ],                                                             │
│   "recommendation": "MERGE" or "CREATE_NEW",                    │
│   "reasoning": "Brief explanation"                              │
│ }                                                                │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ AI RESPONSE:                                                     │
├──────────────────────────────────────────────────────────────────┤
│ {                                                                │
│   "similarCategories": [                                         │
│     {                                                            │
│       "categoryId": "cat_005",                                  │
│       "nameBn": "বিবিধ",                                         │
│       "nameEn": "Miscellaneous",                                │
│       "similarityScore": 0.85,                                  │
│       "reason": "'স্পেশাল আইটেম' এবং 'বিবিধ' একই উদ্দেশ্যে ব্যবহৃত" │
│     },                                                           │
│     {                                                            │
│       "categoryId": "cat_006",                                  │
│       "nameBn": "অন্যান্য",                                      │
│       "nameEn": "Others",                                       │
│       "similarityScore": 0.70,                                  │
│       "reason": "Both used for uncategorized items"             │
│     }                                                            │
│   ],                                                             │
│   "recommendation": "MERGE",                                    │
│   "reasoning": "'স্পেশাল আইটেম' এর জন্য 'বিবিধ' category ব্যবহার করা যায়" │
│ }                                                                │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ ADMIN DECISION MODAL:                                            │
├──────────────────────────────────────────────────────────────────┤
│ ⚠️ AI Detected Similar Categories                               │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ 🟡 "বিবিধ" (Miscellaneous)                                   │ │
│ │    Similarity: 85%                                           │ │
│ │    Reason: একই উদ্দেশ্যে ব্যবহৃত                              │ │
│ │    [Use This Instead]                                        │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ 🟡 "অন্যান্য" (Others)                                        │ │
│ │    Similarity: 70%                                           │ │
│ │    [Use This Instead]                                        │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ AI Recommendation: MERGE with "বিবিধ"                           │
│                                                                  │
│ Admin Decision:                                                  │
│   ○ Approve as new (ignore AI suggestion)                      │
│   ○ Merge with selected category                                │
│   ○ Reject request                                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Updated Database Schema

```sql
-- Category Requests Table (Updated)
CREATE TABLE category_requests (
    id                  UUID PRIMARY KEY,
    business_id         UUID REFERENCES businesses(id),
    business_type       business_type NOT NULL,
    requested_name_bn   VARCHAR(100) NOT NULL,
    requested_name_en   VARCHAR(100),
    parent_id           UUID REFERENCES categories(id),
  
    -- User preference
    scope_suggested     category_scope NOT NULL,  -- BUSINESS/GLOBAL
  
    -- AI Analysis
    ai_similarity_check BOOLEAN DEFAULT FALSE,
    ai_similar_categories JSONB,  -- AI response stored here
    ai_recommendation   VARCHAR(20),  -- MERGE / CREATE_NEW
    ai_reasoning        TEXT,
  
    -- Admin Decision
    status              request_status DEFAULT 'PENDING',
    scope_approved      category_scope,
    reviewed_by         UUID REFERENCES users(id),
    reviewed_at         TIMESTAMP,
    rejection_reason    TEXT,
  
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 Complete Flow Diagram

```
USER REQUEST
     │
     ▼
┌─────────────┐
│ TEXT CHECK  │──► 90%+ Match ──► SUGGEST IMMEDIATELY
└─────────────┘
     │ < 90%
     ▼
┌─────────────┐
│  AI CHECK   │──► Semantic Analysis ──► Return Similar Categories
└─────────────┘
     │
     ▼
┌─────────────┐
│   STORE     │──► Save AI response in JSONB column
└─────────────┘
     │
     ▼
┌─────────────┐
│ ADMIN VIEW  │──► See AI suggestions with scores
└─────────────┘
     │
     ▼
┌─────────────┐
│  DECISION   │──► Approve / Merge / Reject
└─────────────┘
     │
     ▼
  NOTIFY USER
```

---

## ✅ কেন এই Approach সবচেয়ে ভালো?

| Feature                          | Benefit                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| **Semantic Understanding** | "স্পেশাল" = "বিশেষ" = "Special"                     |
| **Bilingual Support**      | Bengali + English দুটোই check                              |
| **AI Reasoning**           | Admin কে বুঝতে সুবিধা হবে                       |
| **Score-based**            | Confidence দেখে decision নেওয়া যাবে              |
| **Cached Response**        | AI response JSONB তে save, পরে দরকার হলে reference |

---

**এই architecture implement করব?** আমাদের existing AI infrastructure (GLM-4/Gemini) ব্যবহার করে এটা সহজেই করা যাবে।
