# DokaniAI REST API Design Specification

## Base URL
```
Production: https://api.dokaniai.com/api/v1
Development: http://localhost:8080/api/v1
```

## Authentication
All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format
### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

---

# API ENDPOINTS

## 1. Authentication Endpoints

### 1.1 Register User (Phone)
```
POST /auth/register/phone
```
**Request Body:**
```json
{
  "name": "রহিম আহমেদ",
  "phone": "+8801712345678",
  "password": "SecurePass123!"
}
```
**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "phone": "+8801712345678",
    "otpSent": true,
    "message": "OTP sent to your phone"
  }
}
```

### 1.2 Verify Phone OTP
```
POST /auth/verify/phone
```
**Request Body:**
```json
{
  "phone": "+8801712345678",
  "otp": "123456"
}
```

### 1.3 Login
```
POST /auth/login
```
**Request Body:**
```json
{
  "phone": "+8801712345678",
  "password": "SecurePass123!",
  "deviceId": "device-uuid",
  "deviceName": "Samsung Galaxy S23",
  "deviceType": "MOBILE"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "name": "রহিম আহমেদ",
      "phone": "+8801712345678",
      "role": "USER",
      "subscription": {
        "plan": "FREE_TRIAL_1",
        "expiresAt": "2024-03-15T00:00:00Z"
      }
    }
  }
}
```

### 1.4 Refresh Token
```
POST /auth/refresh
```
**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### 1.5 Logout (Current Session)
```
POST /auth/logout
```

### 1.6 Logout All Devices
```
POST /auth/logout/all
```

### 1.7 Get Active Sessions
```
GET /auth/sessions
```
**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "deviceName": "Samsung Galaxy S23",
        "deviceType": "MOBILE",
        "ipAddress": "123.45.67.89",
        "lastActivityAt": "2024-01-15T10:30:00Z",
        "isCurrent": true
      }
    ]
  }
}
```

### 1.8 Revoke Session
```
DELETE /auth/sessions/{sessionId}
```

### 1.9 Forgot Password (Send OTP)
```
POST /auth/forgot-password
```
**Request Body:**
```json
{
  "phoneOrEmail": "+8801712345678"
}
```

**Response (OtpResponse):**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "destination": "+8801712345678",
    "expiresInSeconds": 300
  },
  "message": "OTP sent successfully"
}
```

### 1.10 Reset Password
```
POST /auth/reset-password
```
**Request Body:**
```json
{
  "phoneOrEmail": "+8801712345678",
  "otp": "123456",
  "newPassword": "NewSecurePass123!"
}
```

### 1.11 Frontend State Persistence Contract (Forgot/Reset Password)

Client apps must persist reset context so users can recover flow after refresh/reload.

**Required client keys**
- `passwordReset.phoneOrEmail`
- `passwordReset.otpExpiresAt` (epoch ms, usually now + 300s)

**Optional client key**
- `passwordReset.lastOtpSentAt` (for resend countdown UX only)

**Recovery rules**
- On app load, if `otpExpiresAt` is still valid, return user to OTP entry with pre-filled `phoneOrEmail`.
- If expired, keep identifier, clear OTP input, show expiry message, and require resend.
- On successful reset, clear all `passwordReset.*` keys.

**Edge cases**
- Expired OTP: block submit and prompt resend.
- Resend cooldown: client countdown is advisory; backend 429/cooldown is authoritative.
- Back navigation: identifier should remain available.
- Multi-tab: latest reset context wins; show warning if context changes.

**Security notes**
- Never persist OTP value in storage.
- Backend remains source of truth for OTP purpose (`PASSWORD_RESET`), expiry, attempt limits, and cooldown.

Reference: `SRSv2.md` -> `17.4 Sequence Diagram` (Password Reset Flow - Frontend State Persistence Contract).

**Frontend state machine (recommended)**
- `FORGOT_INPUT` -> user submits `phoneOrEmail`
- `OTP_PENDING` -> OTP sent, timer active until `otpExpiresAt`
- `OTP_EXPIRED` -> timer finished, submit disabled, resend enabled by policy
- `RESET_SUCCESS` -> password changed, persistence cleared

**Error handling matrix (must map in UI)**

| API | HTTP | Backend message/code (example) | Frontend action |
|-----|------|--------------------------------|-----------------|
| `/auth/forgot-password` | 429 | too many OTP requests / cooldown | keep user on OTP step, show retry countdown from response if available |
| `/auth/reset-password` | 400 | invalid OTP | show inline OTP error, keep same state |
| `/auth/reset-password` | 400 | OTP expired | move to `OTP_EXPIRED`, show resend CTA |
| `/auth/reset-password` | 429 | too many OTP verification failures | lock submit, show retry-after message |
| `/auth/reset-password` | 200 | success | clear `passwordReset.*`, route to login |

**Minimal client persistence pseudocode**
```javascript
// on forgot-password success
const ttlSeconds = response.data.expiresInSeconds ?? 300;
localStorage.setItem("passwordReset.phoneOrEmail", phoneOrEmail);
localStorage.setItem("passwordReset.otpExpiresAt", String(Date.now() + ttlSeconds * 1000));
localStorage.setItem("passwordReset.lastOtpSentAt", String(Date.now()));

// on app load
const id = localStorage.getItem("passwordReset.phoneOrEmail");
const expiresAt = Number(localStorage.getItem("passwordReset.otpExpiresAt") || 0);
if (id && Date.now() < expiresAt) {
  routeToOtpReset({ phoneOrEmail: id });
}

// on reset success
localStorage.removeItem("passwordReset.phoneOrEmail");
localStorage.removeItem("passwordReset.otpExpiresAt");
localStorage.removeItem("passwordReset.lastOtpSentAt");
```

---

## 2. User Endpoints

### 2.1 Get Current User Profile
```
GET /users/me
```

### 2.2 Update Profile
```
PUT /users/me
```
**Request Body:**
```json
{
  "name": "রহিম আহমেদ",
  "email": "rahim@example.com"
}
```

### 2.3 Change Password
```
PUT /users/me/password
```
**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

### 2.4 Update Preferences
```
PUT /users/me/preferences
```
**Request Body:**
```json
{
  "language": "bn",
  "timezone": "Asia/Dhaka",
  "notificationPreferences": {
    "push": true,
    "email": true,
    "sms": false
  }
}
```

### 2.5 Complete Onboarding Step
```
POST /users/me/onboarding/complete
```
**Request Body:**
```json
{
  "step": 4,
  "language": "bn"
}
```

### 2.6 Get Activity Log
```
GET /users/me/activity-log?startDate=2024-01-01&endDate=2024-01-31&page=0&size=20
```

---

## 3. Business Endpoints

### 3.1 List User's Businesses
```
GET /businesses
```
**Response:**
```json
{
  "success": true,
  "data": {
    "businesses": [
      {
        "id": "uuid",
        "name": "রহিম গ্রোসারী",
        "slug": "rahim-grocery",
        "type": "grocery",
        "status": "ACTIVE",
        "stats": {
          "totalProducts": 45,
          "totalSales": 1250,
          "totalDue": 15000
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "planLimit": 3
  }
}
```

### 3.2 Create Business
```
POST /businesses
```
**Request Body:**
```json
{
  "name": "রহিম গ্রোসারী",
  "type": "grocery",
  "description": "দৈনন্দিন কেনাকাটার দোকান"
}
```

### 3.3 Get Business Details
```
GET /businesses/{businessId}
```

### 3.4 Update Business
```
PUT /businesses/{businessId}
```

### 3.5 Archive Business
```
POST /businesses/{businessId}/archive
```

### 3.6 Delete Business
```
DELETE /businesses/{businessId}
```

### 3.7 Get Business Settings
```
GET /businesses/{businessId}/settings
```

### 3.8 Update Business Settings
```
PUT /businesses/{businessId}/settings
```
**Request Body:**
```json
{
  "currency": "BDT",
  "operatingHoursStart": "09:00",
  "operatingHoursEnd": "21:00",
  "taxEnabled": false,
  "lowStockThreshold": 10
}
```

### 3.9 Get Business Stats
```
GET /businesses/{businessId}/stats
```
**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 45,
    "totalCustomers": 32,
    "totalSalesCount": 1250,
    "totalSalesAmount": 525000.00,
    "totalDueAmount": 15000.00,
    "todaySales": {
      "count": 15,
      "amount": 7500.00,
      "profit": 1500.00
    },
    "lowStockProducts": 5
  }
}
```

---

## 4. Product Endpoints

### 4.1 List Products
```
GET /businesses/{businessId}/products?category=&status=&search=&page=0&size=20
```

### 4.2 Create Product
```
POST /businesses/{businessId}/products
```
**Request Body:**
```json
{
  "name": "চাল",
  "categoryId": "uuid",
  "subCategoryId": "uuid",
  "sku": "RICE-001",
  "unit": "কেজি",
  "costPrice": 50.00,
  "sellPrice": 60.00,
  "stockQty": 100,
  "reorderPoint": 20
}
```

### 4.3 Get Product
```
GET /businesses/{businessId}/products/{productId}
```

### 4.4 Update Product
```
PUT /businesses/{businessId}/products/{productId}
```

### 4.5 Delete Product
```
DELETE /businesses/{businessId}/products/{productId}
```

### 4.6 Bulk Import Products (CSV)
```
POST /businesses/{businessId}/products/import
Content-Type: multipart/form-data
```

### 4.7 Download CSV Template
```
GET /businesses/{businessId}/products/import/template
```

### 4.8 Get Low Stock Products
```
GET /businesses/{businessId}/products/low-stock
```

---

## 5. Category Endpoints

### 5.1 List Categories
```
GET /categories?scope=&businessId=
```

### 5.2 Create Business Category
```
POST /businesses/{businessId}/categories
```
**Request Body:**
```json
{
  "nameBn": "ডাল",
  "nameEn": "Pulses",
  "parentId": "uuid" // optional for sub-category
}
```

### 5.3 Update Category
```
PUT /businesses/{businessId}/categories/{categoryId}
```

### 5.4 Delete Category
```
DELETE /businesses/{businessId}/categories/{categoryId}
```

---

## 6. Sale Endpoints

### 6.1 List Sales
```
GET /businesses/{businessId}/sales?startDate=&endDate=&customerId=&paymentStatus=&page=0&size=20
```

### 6.2 Create Sale
```
POST /businesses/{businessId}/sales
```
**Request Body:**
```json
{
  "customerId": "uuid", // optional
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "unitPrice": 60.00
    },
    {
      "productId": "uuid",
      "quantity": 1,
      "unitPrice": 120.00
    }
  ],
  "discounts": [
    {
      "type": "CASH_PAYMENT",
      "method": "PERCENTAGE",
      "value": 5,
      "reason": "Cash payment discount"
    }
  ],
  "paymentMethod": "CASH",
  "paymentStatus": "PAID",
  "amountPaid": 300.00,
  "notes": "Regular customer"
}
```

### 6.3 Get Sale Details
```
GET /businesses/{businessId}/sales/{saleId}
```

### 6.4 Create Sale via NLP
```
POST /businesses/{businessId}/sales/nlp
```
**Request Body:**
```json
{
  "text": "২ কেজি চাল বিক্রি ৬০ টাকা দরে",
  "customerId": "uuid"
}
```

### 6.5 Create Sale via Voice
```
POST /businesses/{businessId}/sales/voice
Content-Type: multipart/form-data
```
**Request Body:**
```
audio: <audio_file>
customerId: uuid (optional)
```

### 6.6 Get Sale Invoice
```
GET /businesses/{businessId}/sales/{saleId}/invoice
```
**Response:** PDF file

---

## 7. Sale Return Endpoints

### 7.1 List Sale Returns
```
GET /businesses/{businessId}/returns?saleId=&startDate=&endDate=&page=0&size=20
```

### 7.2 Create Sale Return
```
POST /businesses/{businessId}/returns
```
**Request Body:**
```json
{
  "saleId": "uuid",
  "saleItemId": "uuid",
  "quantity": 1,
  "refundAmount": 60.00,
  "returnType": "PARTIAL",
  "reason": "Customer changed mind"
}
```

---

## 8. Customer Endpoints

### 8.1 List Customers
```
GET /businesses/{businessId}/customers?search=&status=&page=0&size=20
```

### 8.2 Create Customer
```
POST /businesses/{businessId}/customers
```
**Request Body:**
```json
{
  "name": "করিম সাহেব",
  "phone": "+8801812345678",
  "address": "ঢাকা, বাংলাদেশ",
  "creditLimit": 5000.00
}
```

### 8.3 Get Customer
```
GET /businesses/{businessId}/customers/{customerId}
```

### 8.4 Update Customer
```
PUT /businesses/{businessId}/customers/{customerId}
```

### 8.5 Get Customer Due History
```
GET /businesses/{businessId}/customers/{customerId}/due-history
```

### 8.6 Get Customer Ledger
```
GET /businesses/{businessId}/customers/{customerId}/ledger?startDate=&endDate=
```

---

## 9. Due Transaction Endpoints

### 9.1 List Due Transactions
```
GET /businesses/{businessId}/due-transactions?customerId=&type=&startDate=&endDate=&page=0&size=20
```

### 9.2 Create Due Transaction (BAKI)
```
POST /businesses/{businessId}/due-transactions/baki
```
**Request Body:**
```json
{
  "customerId": "uuid",
  "amount": 500.00,
  "description": "বাকি নিল",
  "referenceId": "uuid", // sale id
  "paymentMethod": "CASH"
}
```

### 9.3 Create Due Payment (JOMA)
```
POST /businesses/{businessId}/due-transactions/joma
```
**Request Body:**
```json
{
  "customerId": "uuid",
  "amount": 300.00,
  "paymentMethod": "BKASH",
  "discounts": [
    {
      "type": "BULK_PAYMENT",
      "method": "FIXED",
      "value": 20,
      "reason": "Early payment discount"
    }
  ]
}
```

### 9.4 Create Due Adjustment
```
POST /businesses/{businessId}/due-transactions/adjustment
```
**Request Body:**
```json
{
  "customerId": "uuid",
  "amount": 50.00,
  "type": "ADJUSTMENT",
  "description": "Bad debt write-off"
}
```

### 9.5 Get Aged Dues Report
```
GET /businesses/{businessId}/due-transactions/aged?days=30,60,90
```

---

## 10. Discount Endpoints

### 10.1 List Discounts
```
GET /businesses/{businessId}/discounts?type=&customerId=&startDate=&endDate=&page=0&size=20
```

### 10.2 Get Discount Statistics
```
GET /businesses/{businessId}/discounts/stats?startDate=&endDate=
```

---

## 11. Expense Endpoints

### 11.1 List Expenses
```
GET /businesses/{businessId}/expenses?category=&startDate=&endDate=&page=0&size=20
```

### 11.2 Create Expense
```
POST /businesses/{businessId}/expenses
```
**Request Body:**
```json
{
  "category": "RENT",
  "customCategoryName": null,
  "amount": 10000.00,
  "description": "Monthly shop rent",
  "expenseDate": "2024-01-01T00:00:00Z",
  "paymentMethod": "CASH",
  "paymentStatus": "PAID"
}
```

### 11.3 Get Expense
```
GET /businesses/{businessId}/expenses/{expenseId}
```

### 11.4 Update Expense
```
PUT /businesses/{businessId}/expenses/{expenseId}
```

### 11.5 Delete Expense
```
DELETE /businesses/{businessId}/expenses/{expenseId}
```

### 11.6 Get Expense Categories
```
GET /businesses/{businessId}/expenses/categories
```

---

## 12. Report Endpoints

### 12.1 Daily Sales Summary
```
GET /businesses/{businessId}/reports/daily?date=2024-01-15
```
**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "totalSales": 15,
    "totalRevenue": 7500.00,
    "totalCost": 6000.00,
    "totalProfit": 1500.00,
    "totalDiscount": 200.00,
    "paymentBreakdown": {
      "CASH": 4000.00,
      "BKASH": 2500.00,
      "DUE": 1000.00
    }
  }
}
```

### 12.2 Weekly Sales Summary
```
GET /businesses/{businessId}/reports/weekly?startDate=2024-01-08
```

### 12.3 Monthly Sales Summary
```
GET /businesses/{businessId}/reports/monthly?month=2024-01
```

### 12.4 Product-wise Profit Report
```
GET /businesses/{businessId}/reports/products/profit?startDate=&endDate=
```

### 12.5 Expense Category Breakdown
```
GET /businesses/{businessId}/reports/expenses/breakdown?startDate=&endDate=
```

### 12.6 Net Profit Report
```
GET /businesses/{businessId}/reports/net-profit?startDate=&endDate=
```

### 12.7 Due Ledger Report
```
GET /businesses/{businessId}/reports/due-ledger?customerId=
```

### 12.8 Stock Alert Report
```
GET /businesses/{businessId}/reports/stock-alert
```

### 12.9 Export Report (PDF/CSV)
```
GET /businesses/{businessId}/reports/export?type=daily&format=pdf&date=2024-01-15
```

---

## 13. AI Assistant Endpoints

### 13.1 Send Message to AI
```
POST /ai/chat
```
**Request Body:**
```json
{
  "businessId": "uuid",
  "conversationId": "uuid", // optional, for continuing conversation
  "message": "আজকের বিক্রি কত?"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "message": {
      "role": "assistant",
      "content": "আজকের মোট বিক্রি ৭,৫০০ টাকা। ১৫টি লেনদেন হয়েছে। মুনাফা প্রায় ১,৫০০ টাকা।",
      "tokensUsed": 45
    },
    "queriesRemaining": 95
  }
}
```

### 13.2 Voice Query
```
POST /ai/voice
Content-Type: multipart/form-data
```
**Request Body:**
```
audio: <audio_file>
businessId: uuid
conversationId: uuid (optional)
```

### 13.3 Get Conversation History
```
GET /ai/conversations?businessId=&page=0&size=20
```

### 13.4 Get Conversation
```
GET /ai/conversations/{conversationId}
```

### 13.5 Delete Conversation
```
DELETE /ai/conversations/{conversationId}
```

---

## 14. Subscription Endpoints

### 14.1 Get Available Plans
```
GET /subscriptions/plans
```

### 14.2 Get Current Subscription
```
GET /subscriptions/current
```

### 14.3 Upgrade Subscription
```
POST /subscriptions/upgrade
```
**Request Body:**
```json
{
  "planId": "uuid",
  "paymentMethod": "BKASH",
  "couponCode": "NEWYEAR20"
}
```

### 14.4 Downgrade Subscription
```
POST /subscriptions/downgrade
```
**Request Body:**
```json
{
  "planId": "uuid",
  "archiveStrategy": {
    "businesses": ["uuid"], // businesses to archive
    "products": ["uuid"] // products to archive (per business)
  }
}
```

### 14.5 Cancel Scheduled Downgrade
```
DELETE /subscriptions/downgrade
```

### 14.6 Accept Free Trial 2
```
POST /subscriptions/accept-trial-2
```

### 14.7 Pre-downgrade Validation
```
POST /subscriptions/validate-downgrade
```
**Request Body:**
```json
{
  "planId": "uuid"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "issues": [
      {
        "type": "BUSINESS_COUNT",
        "current": 5,
        "limit": 3,
        "excess": 2
      },
      {
        "type": "PRODUCT_COUNT",
        "businessId": "uuid",
        "businessName": "রহিম গ্রোসারী",
        "current": 150,
        "limit": 100,
        "excess": 50
      }
    ]
  }
}
```

---

## 15. Payment Endpoints

### 15.1 Initiate Payment (bKash/Nagad)
```
POST /payments/initiate
```
**Request Body:**
```json
{
  "subscriptionId": "uuid",
  "amount": 399.00,
  "method": "BKASH",
  "idempotencyKey": "unique-request-id",
  "callbackUrl": "https://dokaniai.com/payment/callback"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "gatewayUrl": "https://checkout.bkash.com/...",
    "expiresAt": "2024-01-15T10:30:00Z"
  }
}
```

### 15.2 Payment Callback (Gateway Webhook)
```
POST /payments/callback
```
*(Handled by payment gateway)*

### 15.3 Verify Payment
```
GET /payments/{paymentId}/verify
```

### 15.4 Get Payment History
```
GET /payments/history?page=0&size=20
```

---

## 16. Notification Endpoints

### 16.1 List Notifications
```
GET /notifications?isRead=&type=&page=0&size=20
```

### 16.2 Mark as Read
```
PUT /notifications/{notificationId}/read
```

### 16.3 Mark All as Read
```
PUT /notifications/read-all
```

### 16.4 Get Unread Count
```
GET /notifications/unread-count
```

---

## 17. Support Ticket Endpoints

### 17.1 List Tickets
```
GET /support/tickets?status=&page=0&size=20
```

### 17.2 Create Ticket
```
POST /support/tickets
```
**Request Body:**
```json
{
  "subject": "Cannot add product",
  "description": "Getting error when trying to add new product",
  "category": "TECHNICAL",
  "priority": "MEDIUM"
}
```

### 17.3 Get Ticket
```
GET /support/tickets/{ticketId}
```

### 17.4 Add Message to Ticket
```
POST /support/tickets/{ticketId}/messages
```
**Request Body:**
```json
{
  "message": "I tried again, still getting the same error"
}
```

### 17.5 Close Ticket
```
POST /support/tickets/{ticketId}/close
```

---

## 18. Search Endpoints

### 18.1 Global Search
```
GET /search?businessId=&query=&types=products,sales,customers&page=0&size=20
```

### 18.2 Product Autocomplete
```
GET /search/products/autocomplete?businessId=&query=&limit=10
```

---

## 19. Admin Endpoints (Admin & Super Admin Only)

### 19.1 List All Users
```
GET /admin/users?role=&status=&search=&page=0&size=20
```

### 19.2 Get User Details
```
GET /admin/users/{userId}
```

### 19.3 Suspend User
```
POST /admin/users/{userId}/suspend
```
**Request Body:**
```json
{
  "reason": "Violation of terms",
  "duration": 7 // days, null for indefinite
}
```

### 19.4 Unsuspend User
```
POST /admin/users/{userId}/unsuspend
```

### 19.5 Extend Trial
```
POST /admin/users/{userId}/extend-trial
```
**Request Body:**
```json
{
  "days": 14,
  "reason": "Customer support request"
}
```

### 19.6 Grant Complimentary Upgrade
```
POST /admin/users/{userId}/complimentary
```
**Request Body:**
```json
{
  "planId": "uuid",
  "duration": 30,
  "reason": "Marketing campaign"
}
```

### 19.7 Reset User Password
```
POST /admin/users/{userId}/reset-password
```

### 19.8 Update User Role (Super Admin Only)
```
PUT /admin/users/{userId}/role
```
**Request Body:**
```json
{
  "role": "ADMIN"
}
```

### 19.9 List All Support Tickets (Admin)
```
GET /admin/support/tickets?status=&assignedTo=&page=0&size=20
```

### 19.10 Assign Ticket
```
POST /admin/support/tickets/{ticketId}/assign
```
**Request Body:**
```json
{
  "adminId": "uuid"
}
```

### 19.11 Add Internal Note
```
POST /admin/support/tickets/{ticketId}/internal-note
```
**Request Body:**
```json
{
  "note": "Customer contacted via phone"
}
```

### 19.12 Escalate Ticket
```
POST /admin/support/tickets/{ticketId}/escalate
```

### 19.13 Get Audit Logs (Super Admin)
```
GET /admin/audit-logs?userId=&action=&startDate=&endDate=&page=0&size=50
```

### 19.14 Export Users CSV
```
GET /admin/users/export
```

---

## 20. Data Export Endpoints

### 20.1 Request Data Export
```
POST /data/export
```
**Request Body:**
```json
{
  "businessId": "uuid",
  "format": "CSV", // or JSON
  "include": ["products", "sales", "customers", "expenses", "due_transactions"]
}
```

### 20.2 Verify OTP for Export
```
POST /data/export/verify
```
**Request Body:**
```json
{
  "exportId": "uuid",
  "otp": "123456"
}
```

### 20.3 Download Export
```
GET /data/export/{exportId}/download
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_001` | 401 | Invalid credentials |
| `AUTH_002` | 401 | Token expired |
| `AUTH_003` | 403 | Account locked |
| `AUTH_004` | 400 | OTP expired/invalid |
| `AUTH_005` | 409 | Phone already registered |
| `PRD_001` | 404 | Product not found |
| `PRD_002` | 409 | Duplicate product name |
| `PRD_003` | 400 | Insufficient stock |
| `BUS_001` | 404 | Business not found |
| `BUS_002` | 403 | Business limit reached |
| `SUB_001` | 403 | Subscription required |
| `SUB_002` | 403 | Feature not available in current plan |
| `SUB_003` | 400 | Cannot downgrade - usage exceeds limit |
| `PAY_001` | 400 | Payment failed |
| `PAY_002` | 409 | Duplicate payment |
| `AI_001` | 429 | Daily AI query limit reached |
| `AI_002` | 400 | Query too long |
| `DUE_001` | 404 | Customer not found |
| `DUE_002` | 400 | Invalid transaction type |
| `VAL_001` | 400 | Validation failed |
| `SRV_001` | 500 | Internal server error |

---

## Rate Limits

| Endpoint Type | Rate Limit |
|--------------|------------|
| General API | 60 requests/minute |
| Auth endpoints | 10 requests/minute |
| AI queries | Based on plan |
| Payment | 5 requests/minute |

---

## Voice Session (Phase 1-3)

### Create Voice Session
`POST /voice/sessions`

Request:
```json
{
  "businessId": "uuid"
}
```

### Transcribe Draft
`POST /voice/sessions/{sessionId}/transcribe` (multipart form-data)
- `audio`: audio file (wav/mp3/m4a/webm)

### Update Draft Text
`PATCH /voice/sessions/{sessionId}/draft`

Request:
```json
{
  "draftText": "sell 2 soap for 200"
}
```

### Confirm Draft
`POST /voice/sessions/{sessionId}/confirm`
- Returns `confirmationToken`.

### Parse Preview (Phase 2, no execute)
`POST /voice/sessions/{sessionId}/parse-preview`

Request:
```json
{
  "confirmationToken": "uuid"
}
```

Response (sample):
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "businessId": "uuid",
    "confirmedText": "sell 2 soap for 200",
    "parsedAction": {
      "actionType": "SALE",
      "structuredOutput": "{...}",
      "confidenceScore": 0.92,
      "originalText": "sell 2 soap for 200",
      "needsConfirmation": true
    },
    "previewedAt": "2026-04-06T02:00:00Z"
  },
  "message": "Parse preview generated"
}
```

Notes:
- Parse preview requires session state `CONFIRMED`.
- Token mismatch returns `VOICE_SESSION_NOT_FOUND` with invalid token detail.
- This endpoint does not execute any business transaction.

### Execute Low-Risk (Phase 3)
`POST /voice/sessions/{sessionId}/execute-low-risk`

Request:
```json
{
  "confirmationToken": "uuid"
}
```

Response (sample):
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "businessId": "uuid",
    "confirmedText": "what is today sale",
    "parsedAction": {
      "actionType": "QUERY",
      "confidenceScore": 0.95,
      "originalText": "what is today sale"
    },
    "executedActionType": "QUERY",
    "executionResult": {
      "executed": true,
      "type": "QUERY",
      "response": "Today sale is 500"
    },
    "executedAt": "2026-04-06T03:00:00Z"
  },
  "message": "Low-risk action executed"
}
```

Phase 3 guardrails:
- Allowed action types only: `QUERY`, `EXPENSE`.
- `EXPENSE` is capped by low-risk amount threshold (`voice.execution.low-risk-expense-max`).
- Session is marked as executed after successful run (prevents repeated execution).

Plan limits note:
- Daily query allowance is plan-based (`aiQueriesPerDay`) and applied on AI query execution.
- Per-query token cap is plan-based (`maxAiTokensPerQuery`) and validated before AI provider call.
- If a plan has unlimited AI queries, `aiQueriesPerDay <= 0` is treated as unlimited.

Notes:
- Parse preview requires session state `CONFIRMED`.
- Token mismatch returns `VOICE_SESSION_NOT_FOUND` with invalid token detail.
- This endpoint does not execute any business transaction.
