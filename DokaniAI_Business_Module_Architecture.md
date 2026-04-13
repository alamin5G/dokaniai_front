# DokaniAI Business Module Architecture

## Core Business Features: Product, Sale, Expense, Due Management

Version: 1.0 | Date: April 2025 | Status: Architecture Design

---

# Table of Contents

1. [Module Overview](#1-module-overview)
2. [Page Structure & Routes](#2-page-structure--routes)
3. [Database Schema (Prisma)](#3-database-schema-prisma)
4. [API Architecture](#4-api-architecture)
5. [AI Integration Flow](#5-ai-integration-flow)
6. [State Management](#6-state-management)
7. [Component Architecture](#7-component-architecture)
8. [UI Specifications](#8-ui-specifications)
9. [Feature Requirements Mapping](#9-feature-requirements-mapping)

---

# 1. Module Overview

## 1.1 Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DOKANIAI BUSINESS MODULE DEPENDENCIES                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         ┌─────────────────┐                                 │
│                         │   AUTH MODULE   │                                 │
│                         │  (Prerequisite) │                                 │
│                         └────────┬────────┘                                 │
│                                  │                                          │
│                                  ▼                                          │
│                         ┌─────────────────┐                                 │
│                         │    BUSINESS     │                                 │
│                         │   (Workspace)   │                                 │
│                         └────────┬────────┘                                 │
│                                  │                                          │
│              ┌───────────────────┼───────────────────┐                      │
│              │                   │                   │                      │
│              ▼                   ▼                   ▼                      │
│     ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│     │    PRODUCT     │  │    CUSTOMER    │  │    CATEGORY    │              │
│     │   (Inventory)  │  │   (Due Users)  │  │   (Two-Tier)   │              │
│     └───────┬────────┘  └───────┬────────┘  └────────────────┘              │
│             │                   │                                           │
│             └─────────┬─────────┘                                           │
│                       │                                                     │
│        ┌──────────────┼──────────────┐                                      │
│        │              │              │                                      │
│        ▼              ▼              ▼                                      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                                  │
│  │   SALE    │ │  EXPENSE  │ │    DUE    │                                  │
│  │ (Revenue) │ │  (Cost)   │ │ (Credit)  │                                  │
│  └─────┬─────┘ └───────────┘ └─────┬─────┘                                  │
│        │                         │                                          │
│        └────────────┬────────────┘                                          │
│                     │                                                       │
│                     ▼                                                       │
│            ┌─────────────────┐                                              │
│            │     REPORT      │                                              │
│            │   (Analytics)   │                                              │
│            └─────────────────┘                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Implementation Order

| Phase | Module | Dependencies | SRS Reference |
|-------|--------|--------------|---------------|
| 1 | Business | Auth, Subscription | FR-BUS-01 to 04 |
| 2 | Category | Business | FR-PRD-05 |
| 3 | Product | Business, Category | FR-PRD-01 to 06, FR-STOCK-01 to 03 |
| 4 | Customer | Business | FR-DUE-01, FR-DUE-08 |
| 5 | Sale | Product, Customer | FR-SALE-01 to 04 |
| 6 | Expense | Business, Category | FR-EXP-01 to 03 |
| 7 | Due Management | Customer, Sale | FR-DUE-02 to 07 |
| 8 | Discount | Sale, Due | FR-DISC-01 to 09 |

---

# 2. Page Structure & Routes

## 2.1 Route Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOKANIAI ROUTE STRUCTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PUBLIC ROUTES (No Auth)                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  /                     → Landing Page                                       │
│  /pricing              → Subscription Plans                                 │
│  /login                → Login Page                                         │
│  /register             → Registration Page                                  │
│  /verify-otp           → OTP Verification                                   │
│                                                                             │
│  AUTHENTICATED ROUTES                                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│  /businesses           → Business Overview (Level 1 Dashboard)              │
│  /businesses/new       → Create New Business                               │
│                                                                             │
│  SHOP WORKSPACE (Level 2 - Business Scoped)                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  /shop/[businessId]              → Dashboard Home                           │
│  /shop/[businessId]/products     → Product Inventory                        │
│  /shop/[businessId]/products/new → Add Product                              │
│  /shop/[businessId]/sales        → Sales Entry (POS Style)                  │
│  /shop/[businessId]/sales/history→ Sales History                            │
│  /shop/[businessId]/expenses     → Expense Management                       │
│  /shop/[businessId]/dues         → Due Ledger (বাকী খাতা)                   │
│  /shop/[businessId]/customers    → Customer List                            │
│  /shop/[businessId]/reports      → Reports & Analytics                      │
│  /shop/[businessId]/settings     → Business Settings                        │
│                                                                             │
│  ACCOUNT ROUTES                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  /subscription         → Subscription Management                            │
│  /settings             → Account Settings                                   │
│  /help                 → Help & Support                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Page Layout Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SHOP WORKSPACE LAYOUT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         TOP APP BAR                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │ 🔵 AI Input Bar: "বলুন বা লিখুন..."                    [👤] [🔔] │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌────────────┬─────────────────────────────────────────────────────────┐   │
│  │            │                                                         │   │
│  │   SIDE     │                                                         │   │
│  │   NAV      │                    MAIN CONTENT                         │   │
│  │            │                                                         │   │
│  │  ┌──────┐  │    ┌───────────────────────────────────────────────┐    │   │
│  │  │ ড্যাশ │  │    │                                               │    │   │
│  │  │ বোর্ড │  │    │              PAGE SPECIFIC                   │    │   │
│  │  ├──────┤  │    │              CONTENT AREA                     │    │   │
│  │  │ বিক্রি │  │    │                                               │    │   │
│  │  ├──────┤  │    │              (Dynamic based on route)         │    │   │
│  │  │ পণ্য  │  │    │                                               │    │   │
│  │  ├──────┤  │    │                                               │    │   │
│  │  │ খরচ  │  │    └───────────────────────────────────────────────┘    │   │
│  │  ├──────┤  │                                                         │   │
│  │  │ বাকী │  │                                                         │   │
│  │  ├──────┤  │                                                         │   │
│  │  │ রিপোর্ট│  │                                                         │   │
│  │  ├──────┤  │                                                         │   │
│  │  │ সেটিং│  │                                                         │   │
│  │  └──────┘  │                                                         │   │
│  │            │                                                         │   │
│  └────────────┴─────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      MOBILE BOTTOM NAV                                │   │
│  │         [🏠]      [🛒]      [📋]      [📊]      [👤]                  │   │
│  │         হোম      বিক্রি     বাকী     রিপোর্ট   প্রোফাইল               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      FLOATING AI BUTTON                               │   │
│  │                              [🎤]                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. Database Schema (Prisma)

## 3.1 Core Business Entities

```prisma
// ============================================
// BUSINESS MODULE - PRISMA SCHEMA
// SQLite Compatible for Next.js Development
// ============================================

// ==================== BUSINESS ====================

model Business {
  id              String   @id @default(cuid())
  userId          String
  name            String
  businessType    String?  // grocery, electronics, clothing, etc.
  description     String?
  logoUrl         String?
  phone           String?
  email           String?
  address         String?
  operatingHours  Json?    // { open: "09:00", close: "21:00", days: ["sat","sun",...] }
  currency        String   @default("BDT")
  status          String   @default("ACTIVE") // ACTIVE, ARCHIVED, DELETED
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  categories      Category[]
  products        Product[]
  customers       Customer[]
  sales           Sale[]
  expenses        Expense[]
  dueTransactions DueTransaction[]
  discounts       Discount[]
  inventoryLogs   InventoryLog[]
  
  @@index([userId])
  @@index([status])
}

// ==================== CATEGORY (Two-Tier) ====================

model Category {
  id          String   @id @default(cuid())
  businessId  String?
  parentId    String?
  name        String
  nameEn      String?
  icon        String?
  scope       String   @default("GLOBAL") // GLOBAL, BUSINESS
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  business    Business?  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  
  @@index([businessId])
  @@index([scope])
  @@index([parentId])
}

// ==================== PRODUCT ====================

model Product {
  id              String   @id @default(cuid())
  businessId      String
  categoryId      String?
  name            String
  nameEn          String?
  sku             String?
  barcode         String?
  unit            String   // kg, pcs, liter, bottle, packet
  costPrice       Float    @default(0)
  sellPrice       Float    @default(0)
  stockQty        Float    @default(0)
  reorderPoint    Float?   // Low stock threshold
  status          String   @default("ACTIVE") // ACTIVE, INACTIVE, ARCHIVED
  imageUrl        String?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  category        Category? @relation(fields: [categoryId], references: [id])
  saleItems       SaleItem[]
  inventoryLogs   InventoryLog[]
  
  @@unique([businessId, name])
  @@unique([businessId, sku])
  @@index([businessId])
  @@index([categoryId])
  @@index([status])
}

// ==================== CUSTOMER ====================

model Customer {
  id              String   @id @default(cuid())
  businessId      String
  name            String
  phone           String?
  email           String?
  address         String?
  notes           String?
  runningBalance  Float    @default(0) // Current due amount
  status          String   @default("ACTIVE") // ACTIVE, INACTIVE
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  business        Business         @relation(fields: [businessId], references: [id], onDelete: Cascade)
  dueTransactions DueTransaction[]
  discounts       Discount[]
  
  @@index([businessId])
  @@index([phone])
}

// ==================== SALE ====================

model Sale {
  id              String   @id @default(cuid())
  businessId      String
  customerId      String?
  invoiceNumber   String   @unique
  saleDate        DateTime @default(now())
  subtotal        Float
  discountAmount  Float    @default(0)
  taxAmount       Float    @default(0)
  totalAmount     Float
  paidAmount      Float    @default(0)
  dueAmount       Float    @default(0)
  paymentMethod   String   @default("CASH") // CASH, CREDIT, BKASH, NAGAD, CARD, BANK
  paymentStatus   String   @default("PAID") // PAID, DUE, PARTIAL
  recordedVia     String   @default("MANUAL") // MANUAL, VOICE, NLP
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  customer        Customer? @relation(fields: [customerId], references: [id])
  items           SaleItem[]
  discounts       Discount[]
  returns         SaleReturn[]
  
  @@index([businessId])
  @@index([customerId])
  @@index([saleDate])
  @@index([paymentStatus])
}

model SaleItem {
  id              String   @id @default(cuid())
  saleId          String
  productId       String
  productName     String   // Snapshot at time of sale
  quantity        Float
  unitPrice       Float    // Price at time of sale
  costPrice       Float    // Cost at time of sale
  totalPrice      Float
  profit          Float    // (unitPrice - costPrice) * quantity
  createdAt       DateTime @default(now())
  
  // Relations
  sale            Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product         Product  @relation(fields: [productId], references: [id])
  returnItems     SaleReturnItem[]
  
  @@index([saleId])
  @@index([productId])
}

// ==================== EXPENSE ====================

model ExpenseCategory {
  id          String   @id @default(cuid())
  businessId  String?
  name        String
  nameEn      String?
  icon        String?
  scope       String   @default("GLOBAL") // GLOBAL, BUSINESS
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  business    Business?  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  expenses    Expense[]
  
  @@index([businessId])
  @@index([scope])
}

model Expense {
  id              String   @id @default(cuid())
  businessId      String
  categoryId      String
  amount          Float
  description     String?
  expenseDate     DateTime @default(now())
  paymentMethod   String   @default("CASH") // CASH, BKASH, BANK, DUE
  paymentStatus   String   @default("PAID") // PAID, DUE, PARTIAL
  paidAmount      Float    @default(0)
  receiptUrl      String?
  recordedVia     String   @default("MANUAL") // MANUAL, VOICE, NLP
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  business        Business         @relation(fields: [businessId], references: [id], onDelete: Cascade)
  category        ExpenseCategory  @relation(fields: [categoryId], references: [id])
  
  @@index([businessId])
  @@index([categoryId])
  @@index([expenseDate])
}

// ==================== DUE MANAGEMENT (বাকী খাতা) ====================

model DueTransaction {
  id              String   @id @default(cuid())
  businessId      String
  customerId      String
  transactionType String   // BAKI (owe), JOMA (pay), RETURN, ADJUSTMENT
  amount          Float
  previousBalance Float    // Balance before transaction
  newBalance      Float    // Balance after transaction
  description     String?
  referenceType   String?  // SALE, PAYMENT, ADJUSTMENT
  referenceId     String?  // Link to Sale/Payment
  recordedVia     String   @default("MANUAL") // MANUAL, VOICE, NLP
  createdAt       DateTime @default(now())
  
  // Relations
  business        Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  customer        Customer  @relation(fields: [customerId], references: [id])
  discounts       Discount[]
  
  @@index([businessId])
  @@index([customerId])
  @@index([createdAt])
}

// ==================== DISCOUNT ====================

model Discount {
  id              String   @id @default(cuid())
  businessId      String
  customerId      String?
  saleId          String?
  dueTransactionId String?
  discountType    String   // BULK_PAYMENT, CASH_PAYMENT, LOYALTY, CUSTOM
  discountMethod  String   // PERCENTAGE, FIXED
  discountValue   Float    // Percentage or fixed amount
  discountAmount  Float    // Calculated discount in BDT
  reason          String?
  createdAt       DateTime @default(now())
  
  // Relations
  business        Business         @relation(fields: [businessId], references: [id], onDelete: Cascade)
  customer        Customer?        @relation(fields: [customerId], references: [id])
  sale            Sale?            @relation(fields: [saleId], references: [id])
  dueTransaction  DueTransaction?  @relation(fields: [dueTransactionId], references: [id])
  
  @@index([businessId])
  @@index([customerId])
  @@index([saleId])
}

// ==================== SALE RETURN ====================

model SaleReturn {
  id              String   @id @default(cuid())
  businessId      String
  saleId          String
  returnDate      DateTime @default(now())
  refundAmount    Float
  reason          String?
  status          String   @default("COMPLETED") // PENDING, COMPLETED, CANCELLED
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  sale            Sale             @relation(fields: [saleId], references: [id])
  items           SaleReturnItem[]
  
  @@index([businessId])
  @@index([saleId])
}

model SaleReturnItem {
  id              String   @id @default(cuid())
  returnId        String
  saleItemId      String
  quantity        Float
  refundAmount    Float
  createdAt       DateTime @default(now())
  
  // Relations
  saleReturn      SaleReturn @relation(fields: [returnId], references: [id], onDelete: Cascade)
  saleItem        SaleItem   @relation(fields: [saleItemId], references: [id])
  
  @@index([returnId])
}

// ==================== INVENTORY LOG ====================

model InventoryLog {
  id              String   @id @default(cuid())
  businessId      String
  productId       String
  changeType      String   // SALE, PURCHASE, RETURN, ADJUSTMENT
  previousQty     Float
  changeQty       Float
  newQty          Float
  reason          String?
  performedBy     String?  // User ID
  createdAt       DateTime @default(now())
  
  // Relations
  business        Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  product         Product  @relation(fields: [productId], references: [id])
  
  @@index([businessId])
  @@index([productId])
  @@index([createdAt])
}
```

## 3.2 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIPS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User                                                                       │
│   │                                                                         │
│   │ 1:N                                                                     │
│   ▼                                                                         │
│  Business ──────────────────────────────────────────────────────────────    │
│   │                                                                         │
│   ├── 1:N ── Category ── 1:N ── Product                                     │
│   │                           │                                             │
│   │                           │ 1:N                                         │
│   │                           ▼                                             │
│   │                        SaleItem ◄── N:1 ── Sale                         │
│   │                                          │                              │
│   ├── 1:N ───────────────────────────────────┘                              │
│   │                                          │                              │
│   │                           1:N           │                              │
│   │                            ▼            │                              │
│   ├── 1:N ── Customer ◄─────────────────────┘                              │
│   │             │                                                           │
│   │             │ 1:N                                                       │
│   │             ▼                                                           │
│   │        DueTransaction                                                   │
│   │                                                                          │
│   ├── 1:N ── ExpenseCategory ── 1:N ── Expense                              │
│   │                                                                          │
│   ├── 1:N ── Discount                                                       │
│   │                                                                          │
│   └── 1:N ── InventoryLog                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 4. API Architecture

## 4.1 REST API Endpoints

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API ENDPOINT STRUCTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BASE URL: /api/v1                                                          │
│                                                                             │
│  ==================== BUSINESS ====================                          │
│  GET    /businesses                    → List user's businesses             │
│  POST   /businesses                    → Create new business                │
│  GET    /businesses/:id                → Get business details               │
│  PUT    /businesses/:id                → Update business                    │
│  DELETE /businesses/:id                → Archive business                   │
│                                                                             │
│  ==================== PRODUCTS ====================                         │
│  GET    /businesses/:id/products       → List products (paginated)          │
│  POST   /businesses/:id/products       → Create product                     │
│  GET    /businesses/:id/products/:pid  → Get product details                │
│  PUT    /businesses/:id/products/:pid  → Update product                     │
│  DELETE /businesses/:id/products/:pid  → Archive product                    │
│  GET    /businesses/:id/products/low-stock → Low stock alerts               │
│  POST   /businesses/:id/products/import     → CSV import (Pro+)             │
│                                                                             │
│  ==================== CATEGORIES ====================                       │
│  GET    /categories?scope=global       → List global categories             │
│  GET    /businesses/:id/categories     → List business categories           │
│  POST   /businesses/:id/categories     → Create category                    │
│  PUT    /businesses/:id/categories/:cid→ Update category                    │
│  DELETE /businesses/:id/categories/:cid→ Delete category                    │
│                                                                             │
│  ==================== SALES ====================                            │
│  GET    /businesses/:id/sales          → List sales (paginated)             │
│  POST   /businesses/:id/sales          → Create sale                        │
│  GET    /businesses/:id/sales/:sid     → Get sale details                   │
│  PUT    /businesses/:id/sales/:sid     → Update sale                        │
│  POST   /businesses/:id/sales/:sid/void → Void sale                         │
│  GET    /businesses/:id/sales/today    → Today's sales summary              │
│                                                                             │
│  ==================== EXPENSES ====================                         │
│  GET    /businesses/:id/expenses       → List expenses (paginated)          │
│  POST   /businesses/:id/expenses       → Create expense                     │
│  GET    /businesses/:id/expenses/:eid  → Get expense details                │
│  PUT    /businesses/:id/expenses/:eid  → Update expense                     │
│  DELETE /businesses/:id/expenses/:eid  → Delete expense                     │
│  GET    /businesses/:id/expenses/summary → Monthly breakdown                │
│                                                                             │
│  ==================== CUSTOMERS ====================                        │
│  GET    /businesses/:id/customers      → List customers                     │
│  POST   /businesses/:id/customers      → Create customer                    │
│  GET    /businesses/:id/customers/:cid → Get customer + balance             │
│  PUT    /businesses/:id/customers/:cid → Update customer                    │
│                                                                             │
│  ==================== DUE MANAGEMENT ====================                   │
│  GET    /businesses/:id/dues           → List all dues                      │
│  GET    /businesses/:id/dues/:cid      → Get customer due ledger            │
│  POST   /businesses/:id/dues           → Record due transaction             │
│  GET    /businesses/:id/dues/aged      → Aged dues report (30/60/90)        │
│  POST   /businesses/:id/dues/remind    → Generate WhatsApp link             │
│                                                                             │
│  ==================== DISCOUNTS ====================                        │
│  GET    /businesses/:id/discounts      → List discounts                     │
│  POST   /businesses/:id/discounts      → Create discount                    │
│  GET    /businesses/:id/discounts/summary → Discount summary report         │
│                                                                             │
│  ==================== AI / NLP ====================                         │
│  POST   /ai/parse                      → Parse natural language             │
│  POST   /ai/chat                       → AI chatbot query                   │
│  POST   /ai/transcribe                 → Voice to text (STT)                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Request/Response Examples

### 4.2.1 Create Sale (Multi-Item with Discount)

```typescript
// POST /api/v1/businesses/:id/sales

// Request
{
  "saleDate": "2025-04-13T10:30:00Z",
  "customerId": null, // null for cash sale
  "recordedVia": "MANUAL",
  "items": [
    {
      "productId": "prod_001",
      "quantity": 2,
      "unitPrice": 68.00
    },
    {
      "productId": "prod_002",
      "quantity": 1,
      "unitPrice": 890.00
    }
  ],
  "discounts": [
    {
      "method": "PERCENTAGE",
      "value": 5,
      "reason": "Cash payment discount"
    }
  ],
  "paymentMethod": "CASH",
  "paidAmount": 1026.00
}

// Response
{
  "success": true,
  "data": {
    "id": "sale_001",
    "invoiceNumber": "INV-2025-0001",
    "subtotal": 1026.00,
    "discountAmount": 51.30,
    "totalAmount": 974.70,
    "paidAmount": 974.70,
    "dueAmount": 0,
    "paymentStatus": "PAID",
    "items": [...],
    "createdAt": "2025-04-13T10:30:00Z"
  }
}
```

### 4.2.2 Record Due Transaction

```typescript
// POST /api/v1/businesses/:id/dues

// Request
{
  "customerId": "cust_001",
  "transactionType": "BAKI", // BAKI = owe money, JOMA = pay back
  "amount": 500.00,
  "description": "Rice purchase on credit",
  "referenceType": "SALE",
  "referenceId": "sale_001",
  "recordedVia": "VOICE"
}

// Response
{
  "success": true,
  "data": {
    "id": "due_001",
    "previousBalance": 1200.00,
    "newBalance": 1700.00,
    "createdAt": "2025-04-13T10:35:00Z"
  }
}
```

### 4.2.3 AI Parse Natural Language

```typescript
// POST /api/v1/ai/parse

// Request
{
  "businessId": "biz_001",
  "input": "চাল ২০ কেজি বিক্রি ১২০০ টাকায়",
  "entryMode": "VOICE"
}

// Response
{
  "success": true,
  "data": {
    "actionType": "SALE",
    "confidence": 0.92,
    "parsed": {
      "product": {
        "name": "চাল",
        "suggestedProductId": "prod_001"
      },
      "quantity": 20,
      "unit": "kg",
      "totalPrice": 1200,
      "unitPrice": 60
    },
    "needsConfirmation": true
  }
}
```

---

# 5. AI Integration Flow

## 5.1 Voice-to-Action Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VOICE-TO-ACTION PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │   User      │                                                            │
│  │  Speaks     │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 1: SPEECH-TO-TEXT (STT)                                        │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  • Service: BanglaSpeech2Text (Port 5000)                           │   │
│  │  • Input: Audio blob (WebM/WAV)                                     │   │
│  │  • Output: Bengali text                                             │   │
│  │  • Cost: FREE (local processing)                                    │   │
│  │  • No AI query limit (doesn't count)                                │   │
│  │                                                                      │   │
│  │  Example: "চাল বিশ কেজি বিক্রি বারোশ টাকায়"                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 2: TEXT EDIT (Optional)                                        │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  • User can edit/correct transcribed text                           │   │
│  │  • Auto-fix: Bengali numerals (২০ → 20, ১২০০ → 1200)               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         │ User clicks "Submit"                                             │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 3: AI QUERY LIMIT CHECK                                        │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  if (user.aiQueriesUsedToday >= plan.aiQueriesPerDay) {             │   │
│  │      showError("আজকের AI কুয়েরি সীমা শেষ");                        │   │
│  │      return;                                                         │   │
│  │  }                                                                   │   └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         │ Limit OK                                                          │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 4: NLP PARSING (LLM)                                           │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  • Service: Z.ai GLM-4.7-Flash (FREE)                               │   │
│  │  • Input: "চাল ২০ কেজি বিক্রি ১২০০ টাকায়"                           │   │
│  │  • Output: Structured JSON                                          │   │
│  │  • Counts toward daily AI query limit                               │   │
│  │                                                                      │   │
│  │  Parsed Output:                                                      │   │
│  │  {                                                                   │   │
│  │    "action": "SALE",                                                 │   │
│  │    "product": "চাল",                                                 │   │
│  │    "quantity": 20,                                                   │   │
│  │    "unit": "kg",                                                     │   │
│  │    "totalPrice": 1200,                                               │   │
│  │    "confidence": 0.92                                                │   │
│  │  }                                                                   │   └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 5: PRODUCT MATCHING                                            │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  • Fuzzy match product name with inventory                           │   │
│  │  • Auto-suggest closest match                                        │   │
│  │  • Create new product option if not found                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 6: CONFIRMATION UI                                             │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │ AI বুঝেছে - নিশ্চিত করুন                                     │    │   │
│  │  ├─────────────────────────────────────────────────────────────┤    │   │
│  │  │ পণ্য:    চাল                                                 │    │   │
│  │  │ পরিমাণ: ২০ কেজি                                             │    │   │
│  │  │ মোট:    ৳১,২০০                                              │    │   │
│  │  │                                                              │    │   │
│  │  │ [✓ ঠিক আছে]  [✗ ভুল হয়েছে]                                  │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         │ User confirms                                                     │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  STEP 7: DATABASE SAVE                                               │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  • Create Sale record                                                │   │
│  │  • Update Product stock                                              │   │
│  │  • Create InventoryLog entry                                         │   │
│  │  • Update BusinessStats cache                                        │   │
│  │  • Increment aiQueriesUsedToday                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 AI Command Types

| Bengali Command | Action Type | Parsed Fields |
|-----------------|-------------|---------------|
| "চাল ২০ কেজি বিক্রি ১২০০ টাকায়" | SALE | product, quantity, unit, totalPrice |
| "ডাল ১০ কেজি কিনলাম ৮০০ টাকায়" | PURCHASE | product, quantity, unit, costPrice |
| "রহিম সাহেব ৫০০ টাকা বাকী নিল" | DUE_BAKI | customer, amount |
| "করিম ১০০০ টাকা জমা দিল" | DUE_JOMA | customer, amount |
| "বিদ্যুৎ বিল ২০০০ টাকা খরচ" | EXPENSE | category, amount |
| "চালের স্টক কত?" | QUERY | question about data |
| "আজকের বিক্রয় কত?" | QUERY | question about data |
| "গতকাল চিনি ফেরত এসেছে ২ কেজি" | RETURN | product, quantity |

---

# 6. State Management

## 6.1 Zustand Store Structure

```typescript
// stores/businessStore.ts

interface BusinessState {
  // Current business context
  currentBusinessId: string | null;
  currentBusiness: Business | null;
  
  // Actions
  setCurrentBusiness: (id: string) => void;
  clearBusiness: () => void;
}

// stores/cartStore.ts

interface CartState {
  items: CartItem[];
  discount: Discount | null;
  customerId: string | null;
  
  // Actions
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (discount: Discount) => void;
  setCustomer: (customerId: string) => void;
  clearCart: () => void;
  
  // Computed
  subtotal: number;
  discountAmount: number;
  total: number;
}

// stores/aiStore.ts

interface AIState {
  isRecording: boolean;
  isProcessing: boolean;
  lastTranscript: string | null;
  lastParsedResult: ParsedResult | null;
  queryCount: number;
  queryLimit: number;
  
  // Actions
  startRecording: () => void;
  stopRecording: () => void;
  processVoice: (audioBlob: Blob) => Promise<string>;
  parseText: (text: string) => Promise<ParsedResult>;
  sendChat: (message: string) => Promise<string>;
}
```

## 6.2 React Query Keys

```typescript
// Query Keys Structure
const queryKeys = {
  // Business
  businesses: ['businesses'] as const,
  business: (id: string) => ['businesses', id] as const,
  
  // Products
  products: (businessId: string) => ['businesses', businessId, 'products'] as const,
  product: (businessId: string, productId: string) => 
    ['businesses', businessId, 'products', productId] as const,
  lowStockProducts: (businessId: string) => 
    ['businesses', businessId, 'products', 'low-stock'] as const,
  
  // Sales
  sales: (businessId: string, filters?: SaleFilters) => 
    ['businesses', businessId, 'sales', filters] as const,
  todaySales: (businessId: string) => 
    ['businesses', businessId, 'sales', 'today'] as const,
  
  // Expenses
  expenses: (businessId: string, filters?: ExpenseFilters) => 
    ['businesses', businessId, 'expenses', filters] as const,
  expenseSummary: (businessId: string) => 
    ['businesses', businessId, 'expenses', 'summary'] as const,
  
  // Customers & Dues
  customers: (businessId: string) => 
    ['businesses', businessId, 'customers'] as const,
  dues: (businessId: string) => 
    ['businesses', businessId, 'dues'] as const,
  dueLedger: (businessId: string, customerId: string) => 
    ['businesses', businessId, 'dues', customerId] as const,
  agedDues: (businessId: string) => 
    ['businesses', businessId, 'dues', 'aged'] as const,
};
```

---

# 7. Component Architecture

## 7.1 Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  src/                                                                       │
│  ├── app/                                                                   │
│  │   └── shop/[businessId]/                                                 │
│  │       ├── layout.tsx              → ShopLayout                          │
│  │       ├── page.tsx               → DashboardPage                        │
│  │       ├── products/              → ProductsPage                         │
│  │       ├── sales/                 → SalesPage                            │
│  │       ├── expenses/              → ExpensesPage                         │
│  │       └── dues/                  → DuesPage                             │
│  │                                                                          │
│  ├── components/                                                            │
│  │   ├── layout/                                                            │
│  │   │   ├── Sidebar.tsx            → Desktop side navigation              │
│  │   │   ├── TopAppBar.tsx          → Top bar with AI input                │
│  │   │   ├── MobileNav.tsx          → Bottom mobile navigation             │
│  │   │   └── ShopLayout.tsx         → Main layout wrapper                  │
│  │   │                                                                      │
│  │   ├── common/                                                            │
│  │   │   ├── AIInputBar.tsx         → Voice/Text AI input                  │
│  │   │   ├── FloatingActionButton.tsx→ Floating mic button                  │
│  │   │   ├── ConfirmDialog.tsx      → AI confirmation modal                │
│  │   │   ├── StatusBadge.tsx        → Status badges                        │
│  │   │   ├── SearchInput.tsx        → Search with autocomplete             │
│  │   │   └── DataTable.tsx          → Generic data table                   │
│  │   │                                                                      │
│  │   ├── products/                                                          │
│  │   │   ├── ProductList.tsx         → Product inventory list              │
│  │   │   ├── ProductCard.tsx         → Product row/card                    │
│  │   │   ├── ProductForm.tsx         → Add/Edit product form               │
│  │   │   ├── ProductSearch.tsx       → Product search with filters         │
│  │   │   ├── CategoryFilter.tsx      → Category filter chips               │
│  │   │   └── LowStockAlert.tsx       → Low stock widget                    │
│  │   │                                                                      │
│  │   ├── sales/                                                             │
│  │   │   ├── SalesPOS.tsx            → Main POS interface                  │
│  │   │   ├── ProductSelector.tsx     → Left panel - product selection      │
│  │   │   ├── Cart.tsx                → Right panel - cart                  │
│  │   │   ├── CartItem.tsx            → Individual cart item                │
│  │   │   ├── DiscountInput.tsx       → Discount controls                   │
│  │   │   ├── PaymentButtons.tsx      → Cash/Credit buttons                 │
│  │   │   └── SalesHistory.tsx        → Sales history list                  │
│  │   │                                                                      │
│  │   ├── expenses/                                                          │
│  │   │   ├── ExpenseList.tsx         → Expense list                        │
│  │   │   ├── ExpenseCard.tsx         → Expense item card                   │
│  │   │   ├── ExpenseForm.tsx         → Add/Edit expense form               │
│  │   │   └── ExpenseChart.tsx        → Category breakdown chart            │
│  │   │                                                                      │
│  │   ├── dues/                                                              │
│  │   │   ├── DueList.tsx             → Customer due list                   │
│  │   │   ├── DueCard.tsx             → Customer due card                   │
│  │   │   ├── DueTransactionForm.tsx  → BAKI/JOMA form                      │
│  │   │   ├── DueLedger.tsx           → Transaction history                 │
│  │   │   ├── WhatsAppButton.tsx      → WhatsApp reminder button            │
│  │   │   └── AgedDuesWidget.tsx      → 30/60/90 day alerts                 │
│  │   │                                                                      │
│  │   └── ai/                                                                │
│  │       ├── VoiceRecorder.tsx       → Audio recording component           │
│  │       ├── TranscriptionResult.tsx → Text result display                 │
│  │       ├── ParsedResultPreview.tsx → AI parsed result preview            │
│  │       └── AIChatWidget.tsx        → AI chat interface                   │
│  │                                                                          │
│  └── hooks/                                                                 │
│      ├── useVoiceRecorder.ts        → Microphone + recording               │
│      ├── useSpeechToText.ts         → STT API integration                  │
│      ├── useAIParse.ts              → NLP parsing                           │
│      ├── useAIChat.ts               → Chatbot                              │
│      ├── useCart.ts                 → Cart state                           │
│      └── useBusiness.ts             → Business context                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 7.2 Sales Page Component Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SALES PAGE COMPONENT STRUCTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         TOP APP BAR                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │ [🎤] AI Input Bar: "বলুন বা লিখুন..."               [🔔] [👤]  │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────┬────────────────────────────────────┐   │
│  │                                 │                                    │   │
│  │      PRODUCT SELECTOR           │           CART PANEL               │   │
│  │      ─────────────────          │           ────────────             │   │
│  │                                 │                                    │   │
│  │  ┌───────────────────────────┐  │  ┌─────────────────────────────┐  │   │
│  │  │ [🔍] Search products...   │  │  │  বিক্রয় তালিকা              │  │   │
│  │  └───────────────────────────┘  │  │  ─────────────────────      │  │   │
│  │                                 │  │                             │  │   │
│  │  ┌───────────────────────────┐  │  │  ┌─────────────────────┐   │  │   │
│  │  │ [সবগুলো] [চাল] [ডাল] ... │  │  │  │ মিনিকেট চাল     ৳১৩৬│   │  │   │
│  │  │ Category Filter Chips     │  │  │  │ ২ কেজি × ৳৬৮         │   │  │   │
│  │  └───────────────────────────┘  │  │  │      [-] ২ [+]       │   │  │   │
│  │                                 │  │  └─────────────────────┘   │  │   │
│  │  ┌───────────────────────────┐  │  │                             │  │   │
│  │  │ Product Name    Unit Price│  │  │  ┌─────────────────────┐   │  │   │
│  │  │ ───────────────────────── │  │  │  │ সয়াবিন তেল     ৳৮৯০│   │  │   │
│  │  │ মিনিকেট চাল    ৳৬৮   [+] │  │  │  │ ১ বোতল × ৳৮৯০       │   │  │   │
│  │  │ ⚠️ Low Stock: ৩ কেজি     │  │  │  │      [-] ১ [+]       │   │  │   │
│  │  │ ───────────────────────── │  │  │  └─────────────────────┘   │  │   │
│  │  │ মসুর ডাল      ৳১৩৫  [+] │  │  │                             │  │   │
│  │  │ স্টক: ১২০ কেজি          │  │  │  ─────────────────────────  │  │   │
│  │  │ ───────────────────────── │  │  │  ডিসকাউন্ট যোগ করুন       │  │   │
│  │  │ সয়াবিন তেল    ৳৮৯০  [+] │  │  │  ┌─────────┬─────────┐    │  │   │
│  │  │ স্টক: ২৫ বোতল           │  │  │  │   ৳    │    %    │    │  │   │
│  │  │ ───────────────────────── │  │  │  └─────────┴─────────┘    │  │   │
│  │  │ ... more products ...    │  │  │  [_______৫০__________]    │  │   │
│  │  └───────────────────────────┘  │  │                             │  │   │
│  │                                 │  │  ─────────────────────────  │  │   │
│  │                                 │  │  সাবটোটাল         ৳১০২৬   │  │   │
│  │                                 │  │  ডিসকাউন্ট          ৳৫০   │  │   │
│  │                                 │  │  ─────────────────────────  │  │   │
│  │                                 │  │  সর্বমোট          ৳৯৭৬    │  │   │
│  │                                 │  │                             │  │   │
│  │                                 │  │  ┌─────────────────────┐   │  │   │
│  │                                 │  │  │  নগদ বিক্রি (Cash)  │   │  │   │
│  │                                 │  │  │  তাত্ক্ষণিক রসিদ     │   │  │   │
│  │                                 │  │  └─────────────────────┘   │  │   │
│  │                                 │  │  ┌─────────────────────┐   │  │   │
│  │                                 │  │  │ 👤 বাকী বিক্রি       │   │  │   │
│  │                                 │  │  └─────────────────────┘   │  │   │
│  │                                 │  └─────────────────────────────┘  │   │
│  └─────────────────────────────────┴────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 8. UI Specifications

## 8.1 Design System Tokens

```typescript
// tailwind.config.ts - Extended theme

const dokaniAITheme = {
  colors: {
    // Primary (Green - Trust, Growth)
    primary: {
      DEFAULT: '#003727',
      light: '#00503a',
      dark: '#002116',
      container: '#00503a',
      fixed: '#adf1d2',
      fixedDim: '#91d4b7',
    },
    
    // Secondary (Blue - Professional)
    secondary: {
      DEFAULT: '#0061a4',
      light: '#77b7ff',
      dark: '#00477b',
      container: '#77b7ff',
      fixed: '#d1e4ff',
      fixedDim: '#9fcaff',
    },
    
    // Tertiary (Red - Alerts, Urgent)
    tertiary: {
      DEFAULT: '#531e1a',
      light: '#6f342e',
      container: '#6f342e',
      fixed: '#ffdad6',
      fixedDim: '#ffb4ab',
    },
    
    // Surface (Background shades)
    surface: {
      DEFAULT: '#f8faf6',
      dim: '#d8dbd7',
      bright: '#f8faf6',
      container: {
        DEFAULT: '#ecefeb',
        low: '#f2f4f0',
        high: '#e6e9e5',
        highest: '#e1e3df',
        lowest: '#ffffff',
      },
    },
    
    // Status Colors
    error: '#ba1a1a',
    success: '#006a4e',
    warning: '#7c5800',
    info: '#0061a4',
  },
  
  fontFamily: {
    bengali: ['Hind Siliguri', 'sans-serif'],
    headline: ['Manrope', 'Hind Siliguri', 'sans-serif'],
    body: ['Manrope', 'Hind Siliguri', 'sans-serif'],
  },
  
  borderRadius: {
    DEFAULT: '1rem',
    lg: '2rem',
    xl: '3rem',
    full: '9999px',
  },
};
```

## 8.2 Common UI Patterns

### Status Badges

| Status | Color | Bengali Label |
|--------|-------|---------------|
| PAID | success (green) | পরিশোধিত |
| DUE | tertiary (red) | বাকি |
| PARTIAL | warning (amber) | আংশিক |
| ACTIVE | success | সক্রিয় |
| INACTIVE | neutral | নিষ্ক্রিয় |
| LOW_STOCK | warning | অল্প স্টক |
| OUT_OF_STOCK | error | স্টক আউট |
| URGENT | tertiary | অতি জরুরি |
| REGULAR | secondary | নিয়মিত |
| NEW | neutral | নতুন |

### Priority Indicators (Due Management)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PRIORITY INDICATORS                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔴 অতি জরুরি (Urgent)   → Due > 30 days, Amount > ৳10,000                  │
│  🟡 মাঝারি (Medium)      → Due 15-30 days, Amount ৳5,000-10,000             │
│  🟢 নিয়মিত (Regular)    → Due < 15 days, Amount < ৳5,000                   │
│  ⚪ নতুন (New)          → First transaction, no payment yet                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 9. Feature Requirements Mapping

## 9.1 SRS to Architecture Mapping

| SRS ID | Requirement | Architecture Component |
|--------|-------------|------------------------|
| FR-BUS-01 | Create, edit, delete businesses | Business CRUD API + /businesses pages |
| FR-BUS-02 | Show business count and limit | Subscription middleware + Dashboard widget |
| FR-BUS-03 | Archived businesses section | Business.status = 'ARCHIVED' + Filter UI |
| FR-BUS-04 | Operating hours | Business.operatingHours JSON + Reports |
| FR-PRD-01 | Add products with details | Product CRUD API + ProductForm component |
| FR-PRD-02 | Enforce product limit | Subscription middleware + Error SUB_003 |
| FR-PRD-03 | Stock alert threshold | Product.reorderPoint + LowStockAlert |
| FR-PRD-04 | Prevent duplicate names | Unique constraint + Error PRD_002 |
| FR-PRD-05 | Two-tier category | Category.parentId + CategoryFilter |
| FR-PRD-06 | CSV import | /products/import API + Pro+ feature |
| FR-STOCK-01 | Set reorder point | Product.reorderPoint field |
| FR-STOCK-02 | Reorder widget | LowStockAlert component |
| FR-STOCK-03 | AI suggest reorder | AI parse + AIInsight widget |
| FR-SALE-01 | Record sales | Sales API + SalesPOS component |
| FR-SALE-02 | Auto profit calculation | SaleItem.profit computed |
| FR-SALE-03 | Voice input | AIInputBar + VoiceRecorder |
| FR-SALE-04 | Apply discounts | Discount table + DiscountInput |
| FR-EXP-01 | Record expenses | Expense API + ExpenseForm |
| FR-EXP-02 | Net profit calculation | Reports API |
| FR-EXP-03 | Expense categories | ExpenseCategory table |
| FR-NLP-01 | Natural language input | AI parse API + AIInputBar |
| FR-RETURN-01 | Sale return | SaleReturn API + ReturnForm |
| FR-RETURN-02 | Restore stock | InventoryLog + Stock update |
| FR-RETURN-03 | Profit adjustment | Return amount in reports |
| FR-RETURN-04 | AI return query | AI parse action = RETURN |
| FR-DUE-01 | Create customers | Customer API + CustomerForm |
| FR-DUE-02 | Due transactions | DueTransaction API + DueTransactionForm |
| FR-DUE-03 | Running balance | Customer.runningBalance |
| FR-DUE-04 | AI due query | AI parse action = DUE_BAKI/JOMA |
| FR-DUE-05 | Mixed entry items | Cart + DueTransaction combined |
| FR-DUE-06 | Due ledger report | /dues/:customerId API |
| FR-DUE-07 | Aged dues | /dues/aged API + AgedDuesWidget |
| FR-DUE-08 | Prompt new customer | AI parse + Customer create prompt |
| FR-DISC-01 | Percentage + Fixed | Discount.discountMethod |
| FR-DISC-02 | Discount types | Discount.discountType |
| FR-DISC-03 | Sale + Due discounts | Discount.saleId / dueTransactionId |
| FR-DISC-04 | Sequential discounts | Discount[] array in sale |
| FR-DISC-05 | Calculate discount_amount | Computed in sale creation |
| FR-DISC-06 | Discount reason | Discount.reason |
| FR-DISC-07 | Saved amount metrics | Reports + Customer ledger |
| FR-DISC-08 | Voice fixed discount | AI parse discount |
| FR-DISC-09 | Voice percentage discount | AI parse discount |

## 9.2 Implementation Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION CHECKLIST                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: FOUNDATION                                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ☐ Prisma Schema - All models defined                                       │
│  ☐ Database migrations                                                      │
│  ☐ Business CRUD API                                                        │
│  ☐ Category API (Global + Business)                                         │
│  ☐ Shop Layout (Sidebar, TopAppBar, MobileNav)                              │
│                                                                             │
│  PHASE 2: PRODUCT MODULE                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ☐ Product CRUD API                                                         │
│  ☐ Product List Page                                                        │
│  ☐ Product Form (Add/Edit)                                                  │
│  ☐ Product Search with autocomplete                                         │
│  ☐ Category Filter chips                                                    │
│  ☐ Low Stock Alert widget                                                   │
│  ☐ Stock management (reorder point)                                         │
│                                                                             │
│  PHASE 3: SALES MODULE                                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ☐ Sales POS Page layout                                                    │
│  ☐ Product Selector panel                                                   │
│  ☐ Cart component                                                           │
│  ☐ Discount input (fixed/percentage)                                        │
│  ☐ Payment buttons (Cash/Credit)                                            │
│  ☐ Sales History page                                                       │
│  ☐ Invoice generation                                                        │
│                                                                             │
│  PHASE 4: EXPENSE MODULE                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ☐ Expense Category API                                                     │
│  ☐ Expense CRUD API                                                         │
│  ☐ Expense List Page                                                        │
│  ☐ Expense Form                                                             │
│  ☐ Expense Chart (category breakdown)                                       │
│  ☐ Monthly summary widget                                                   │
│                                                                             │
│  PHASE 5: DUE MANAGEMENT                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ☐ Customer CRUD API                                                        │
│  ☐ Due Transaction API                                                      │
│  ☐ Customer Due List Page                                                   │
│  ☐ Due Transaction Form (BAKI/JOMA)                                         │
│  ☐ Due Ledger view                                                          │
│  ☐ WhatsApp Reminder button                                                 │
│  ☐ Aged Dues widget (30/60/90 days)                                         │
│                                                                             │
│  PHASE 6: AI INTEGRATION                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ☐ Voice Recorder component                                                 │
│  ☐ BanglaSpeech2Text integration                                            │
│  ☐ AI Parse API                                                             │
│  ☐ AI Confirmation Dialog                                                   │
│  ☐ AI Input Bar (all pages)                                                 │
│  ☐ Floating AI Button                                                       │
│  ☐ AI Query limit enforcement                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# Summary

This architecture document covers:

1. **Module Dependencies** - Clear order of implementation
2. **Page Routes** - Two-level dashboard structure
3. **Database Schema** - All models for Business, Product, Sale, Expense, Due
4. **API Design** - RESTful endpoints with examples
5. **AI Flow** - Voice-to-action pipeline
6. **State Management** - Zustand + React Query structure
7. **Component Architecture** - Reusable component hierarchy
8. **UI Specifications** - Design tokens and patterns
9. **SRS Mapping** - Requirements to implementation mapping

**Next Step**: Start implementing Phase 1 (Foundation) with Prisma Schema and Business API.
