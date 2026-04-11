# DokaniAI Postman Testing Guide (Complete Workflow)

Source of truth:
- Swagger UI: `http://localhost:8081/api/swagger-ui/index.html`
- Collection: `postman/DokaniAI_API_Collection.json`

This guide is intentionally end-to-end, not a short summary.

---

## 0) Quick Setup (Do This First)

1. Import `postman/DokaniAI_API_Collection.json`.
2. Create environment `DokaniAI Local`.
3. Set initial variables:
   - `baseUrl = http://localhost:8081`
   - `deviceId = 550e8400-e29b-41d4-a716-446655440000`
4. Clear stale variables before a fresh run:
   - `accessToken`, `refreshToken`, `businessId`, `userId`, `ticketId`, `paymentIntentId`, `voiceSessionId`, `confirmationToken`

Recommended persona environments to avoid token confusion:
- `DokaniAI Owner`
- `DokaniAI SuperAdmin`
- `DokaniAI Admin`

---

## 1) Business Owner Journey (Registration -> Login -> Business -> Core Use)

### 1.1 Register and verify owner

1. `Authentication / Register with Phone`
   - `POST {{baseUrl}}/api/v1/auth/register/phone`
2. `Authentication / Verify Phone OTP`
   - `POST {{baseUrl}}/api/v1/auth/verify/phone`
3. `Authentication / Login`
   - `POST {{baseUrl}}/api/v1/auth/login`
4. `User / Get Me`
   - `GET {{baseUrl}}/api/v1/users/me`

Expected:
- Login returns token.
- `Get Me` returns correct owner identity.

### 1.2 Create and verify business

1. `Business / Create Business`
   - `POST {{baseUrl}}/api/v1/businesses`
2. `Business / Get Business`
   - `GET {{baseUrl}}/api/v1/businesses/{{businessId}}`
3. `Business / Get Business Stats`

Expected:
- `businessId` is captured.
- Stats endpoint responds under same tenant.

### 1.3 Owner data setup + operations

1. `Customers / Create Customer`
2. `Products / Create Product`
3. `Sales / Create Sale`
4. `Due Transactions / Create Due Transaction (BAKI)`
5. `Expenses / Create Expense`
6. `Reports / Dashboard Summary`

Expected:
- Write operations are visible in list/report endpoints.

### 1.4 Owner support + export checks

1. `Support Tickets / Create Ticket`
2. `Support Tickets / List My Tickets`
3. `Data Export / Request Export`
4. `Data Export / Verify Export OTP`
5. `Data Export / Download Export`

---

## 2) Super Admin Journey

### 2.1 Super admin login and base validation

1. `Authentication / Login` (super admin credentials)
2. `Admin / Admin System Stats`
3. `Admin / Admin Audit Logs`

Expected:
- Admin system endpoints return success.

### 2.2 User governance

1. `Admin / Admin List Users`
2. Set `{{userId}}` from list
3. `Admin / Admin User Details`
4. `Admin / Admin Suspend User`
5. `Admin / Admin Unsuspend User`
6. `Admin / Admin Extend Trial`
7. `Admin / Admin Complimentary Upgrade`

---

## 3) Create Admin Using Super Admin Identity

### 3.1 Promote existing user to admin

1. `Admin / Admin Update Role`
   - `PUT {{baseUrl}}/api/v1/admin/users/{{userId}}/role`
   - Body role: `ADMIN`
2. `Admin / Admin User Details`

Expected:
- Role reflects `ADMIN`.

---

## 4) Test the New Admin Account

### 4.1 Login as promoted admin

1. `Authentication / Login` (promoted user credentials)

### 4.2 Endpoints that should pass

1. `Admin / Admin List Users`
2. `Admin / Admin User Details`
3. `Admin / Admin List Tickets`
4. `Admin / Admin Assign Ticket`
5. `Admin / Admin Respond Ticket`

### 4.3 Endpoints that should fail (if super-admin-only)

1. `Admin / Admin System Stats`
2. `Admin / Admin Update Role`
3. `Admin / Admin Export Users CSV`

Expected:
- These should return `403` for non-super-admin.

---

## 5) Payment Flow (Owner + Admin)

### 5.1 Owner payment intent flow

1. `Payments / Initialize Payment Intent`
2. `Payments / Submit TrxID`
3. `Payments / Payment Intent Status`
4. `Payments / Resubmit Payment Intent` (if needed)

### 5.2 Admin payment review flow

1. `Payments / Admin Manual Review Queue`
2. `Payments / Admin Verify Manual` or `Payments / Admin Reject Manual`
3. Re-check `Payments / Payment Intent Status`

---

## 6) AI Flow (Two-step + Voice)

### 6.1 Parse/execute two-step flow

1. `AI - Extended / Parse & Execute - Step 1 (No confirmationToken)`
2. `AI - Extended / Parse & Execute - Step 2 (Financial with confirmationToken + idempotencyKey)`

Expected:
- Step 1 returns preview/confirmation details for risky actions.
- Step 2 executes only with valid confirmation and idempotency controls.

### 6.2 Voice session flow (full)

1. `AI - Extended / 1) Create Voice Session`
2. `AI - Extended / 2) Transcribe Draft`
3. `AI - Extended / 3) Edit Draft`
4. `AI - Extended / 4) Confirm Draft`
5. `AI - Extended / 5) Parse Preview`
6. `AI - Extended / 6) Execute Low Risk`

Expected:
- Voice and text execute through same policy rules.

---

## 7) AI Regression Scenarios (Run Folder in Order)

Folder: `AI Regression Scenarios`

Run sequence:
1. `SETUP 1 - Get Confirmation Token`
2. `NEG-01 Invalid Confirmation Token`
3. `SETUP 2 - Execute Financial Command Once`
4. `NEG-02 Duplicate Idempotency Replay`
5. `NEG-03 Quota Reached (AI Chat)`

Expected failures:
- Invalid confirmation token -> confirmation error response.
- Duplicate idempotency -> conflict/replay protection response.
- Quota reached -> `429`.

---

## 8) Ready-to-Use Request Body Examples (Copy/Paste)

Use `Body -> raw -> JSON`.

### 8.1 Registration (Phone)
Request: `Authentication / Register with Phone`

```json
{
  "phone": "+8801712345678",
  "name": "Test User",
  "referralCode": null
}
```

### 8.2 Verify Phone OTP
Request: `Authentication / Verify Phone OTP`

```json
{
  "phone": "+8801712345678",
  "otp": "123456"
}
```

### 8.3 Login
Request: `Authentication / Login`

```json
{
  "phoneOrEmail": "+8801712345678",
  "password": "Password123",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "deviceName": "Test Device",
  "deviceType": "MOBILE",
  "userAgent": "DokaniAI-Test/1.0"
}
```

### 8.4 Create Business
Request: `Business / Create Business`

```json
{
  "name": "My Dokan",
  "type": "GROCERY",
  "description": "Local grocery shop",
  "currency": "BDT"
}
```

### 8.5 Promote Admin Role
Request: `Admin / Admin Update Role`

```json
{
  "role": "ADMIN"
}
```

### 8.6 Initialize Payment Intent
Request: `Payments / Initialize Payment Intent`

```json
{
  "subscriptionId": null,
  "businessId": "{{businessId}}",
  "amount": 500,
  "mfsMethod": "BKASH",
  "idempotencyKey": "intent-001"
}
```

### 8.7 Create Support Ticket
Request: `Support Tickets / Create Ticket`

```json
{}
```

Note:
- Current collection defines ticket body as `{}`.
- If backend now enforces fields like subject/category/message, confirm using Swagger request schema and update this section.

---

## 9) Common Failure Matrix

- `401`: token missing/expired/wrong persona token.
- `403`: role mismatch (admin trying super-admin-only endpoint).
- `404`: wrong resource ID or tenant mismatch.
- `409`: duplicate/idempotency conflict.
- `429`: plan quota or AI usage limit exceeded.

---

## 9.1 Auth Reset Regression (Frontend Persistence + Backend Enforcement)

Use these existing requests in order:
- `Auth - Extended / Forgot Password`
- `Auth - Extended / Reset Password`

Variables to observe during run:
- `phoneOrEmail`
- `passwordReset.phoneOrEmail` (frontend state)
- `passwordReset.otpExpiresAt` (frontend state)

### Case A: Happy path with persistence cleanup
1. Call `Forgot Password` with valid `phoneOrEmail`.
2. Verify response has `expiresInSeconds` (usually 300).
3. In frontend, persist `passwordReset.phoneOrEmail` and `passwordReset.otpExpiresAt`.
4. Submit valid OTP + new password via `Reset Password`.
5. Expect `200` and clear all `passwordReset.*` keys.

### Case B: Reload recovery before expiry
1. Call `Forgot Password` and store state.
2. Refresh app before timer ends.
3. Frontend should restore OTP screen using stored `phoneOrEmail`.
4. Submit valid OTP -> expect success.

### Case C: Expired OTP
1. Call `Forgot Password`.
2. Wait past expiry or use an old OTP.
3. Call `Reset Password`.
4. Expect `400` (expired/invalid OTP) and frontend state moves to expired/resend mode.

### Case D: Resend cooldown / abuse protection
1. Trigger `Forgot Password` repeatedly.
2. Expect `429` when limit is hit.
3. Frontend must show retry countdown/message; user remains on same flow.

### Case E: OTP failure lock path
1. Call `Forgot Password` once.
2. Submit wrong OTP repeatedly in `Reset Password`.
3. Expect lock behavior (`429` too many OTP verification failures).
4. Confirm reset is blocked until retry window passes.

### Case F: Identifier channel consistency
1. Run `Forgot Password` using email identifier.
2. Complete reset via OTP.
3. Validate account can login with updated password and verification state is consistent.

Traceability:
- API contract: `API_Design.md` section `1.11`
- SRS behavior: `SRSv2.md` section `17.4`

---

## 10) Swagger Blank Page Quick Check

If `http://localhost:8081/api/swagger-ui/index.html` shows a blank page:

1. Hard refresh browser and clear cache.
2. Open DevTools console/network to identify failing asset URL.
3. Verify these endpoints respond:
   - `{{baseUrl}}/api/v3/api-docs`
   - `{{baseUrl}}/api/swagger-ui/index.html`
4. If app has reverse-proxy/context-path rules, confirm `/api` prefix is applied consistently for both docs JSON and UI static assets.

---

## 11) Fast Smoke Plans

### 11.1 Owner 10-step smoke
1. Register with phone
2. Verify OTP
3. Login
4. Create business
5. Create customer
6. Create product
7. Create sale
8. Create expense
9. Dashboard summary
10. Create support ticket

### 11.2 Super admin 8-step smoke
1. Login super admin
2. Admin list users
3. Admin user details
4. Suspend user
5. Unsuspend user
6. List tickets
7. Assign/respond ticket
8. Audit logs

### 11.3 Admin creation + validation 8-step smoke
1. Login super admin
2. Promote user to ADMIN
3. Verify updated role
4. Login promoted admin
5. Admin list users (pass)
6. Admin list tickets (pass)
7. Admin system stats (expect 403)
8. Admin update role (expect 403)

---

## 12) Full Endpoint Coverage Map (So Nothing Is Missed)

Your current collection has **211 requests** across these folders:

- `Authentication` (6)
- `Business` (3)
- `Customers` (6)
- `Products` (6)
- `Sales` (2)
- `Due Transactions` (3)
- `Expenses` (2)
- `Reports` (4)
- `AI Features` (2)
- `Auth - Extended` (7)
- `User` (8)
- `Business - Extended` (12)
- `Products - Extended` (3)
- `Customers - Extended` (2)
- `Sales - Extended` (11)
- `Sale Returns` (5)
- `Category` (6)
- `Category Requests` (14)
- `Coupons` (10)
- `Discounts` (4)
- `Due Transactions - Extended` (7)
- `Expenses - Extended` (7)
- `Reports - Extended` (8)
- `Inventory` (5)
- `Notifications` (7)
- `Payments` (14)
- `Subscriptions` (9)
- `Support Tickets` (6)
- `AI - Extended` (12)
- `AI Regression Scenarios` (5)
- `Data Export` (3)
- `Admin` (16)

If you only run Sections 1-11, you are doing smoke + critical journeys. To cover almost all APIs, run Section 13 order.

---

## 13) Complete Test Order (P0 -> P1 -> P2)

### P0 (Must pass first: auth, tenant, money, role)

Run folders in this order:
1. `Authentication`
2. `Business`
3. `Customers`
4. `Products`
5. `Sales`
6. `Due Transactions`
7. `Expenses`
8. `Reports`
9. `Payments`
10. `Subscriptions`
11. `Support Tickets`
12. `Admin`

Stop condition:
- If P0 has blocking failures (`401`, tenant leakage, payment status corruption, role leakage), fix before P1.

### P1 (Core product depth)

1. `Auth - Extended`
2. `User`
3. `Business - Extended`
4. `Products - Extended`
5. `Customers - Extended`
6. `Sales - Extended`
7. `Sale Returns`
8. `Category`
9. `Category Requests`
10. `Coupons`
11. `Discounts`
12. `Due Transactions - Extended`
13. `Expenses - Extended`
14. `Reports - Extended`
15. `Inventory`
16. `Notifications`
17. `Data Export`

### P2 (AI safety and regression hardening)

1. `AI Features`
2. `AI - Extended`
3. `AI Regression Scenarios` (must run exactly in request order)

---

## 14) Folder Completion Checklist (Run One by One)

Mark each line as done in your QA sheet.

### 14.1 Identity and access
- [ ] `Authentication`: register/verify/login/refresh/logout/session checks
- [ ] `Auth - Extended`: email verification + password reset + session revoke
- [ ] `User`: profile update/password/preferences/onboarding/activity log

### 14.2 Tenant and business lifecycle
- [ ] `Business`: create/get/stats
- [ ] `Business - Extended`: list/update/archive/delete/settings/onboarding/admin stats

### 14.3 Commerce core
- [ ] `Customers` + `Customers - Extended`
- [ ] `Products` + `Products - Extended`
- [ ] `Sales` + `Sales - Extended`
- [ ] `Sale Returns`
- [ ] `Inventory`

### 14.4 Financial integrity
- [ ] `Due Transactions` + `Due Transactions - Extended`
- [ ] `Expenses` + `Expenses - Extended`
- [ ] `Reports` + `Reports - Extended`
- [ ] `Discounts`
- [ ] `Coupons`
- [ ] `Payments`
- [ ] `Subscriptions`

### 14.5 Taxonomy and support
- [ ] `Category`
- [ ] `Category Requests`
- [ ] `Support Tickets`
- [ ] `Notifications`
- [ ] `Data Export`

### 14.6 AI and policy enforcement
- [ ] `AI Features`
- [ ] `AI - Extended`
- [ ] `AI Regression Scenarios`

Critical assertions during full run:
- `403` on super-admin-only endpoints when token is normal admin.
- `429` appears for quota limits where expected.
- Confirmation token + idempotency checks prevent unsafe/duplicate financial execution.
- No cross-tenant data visibility across business-scoped endpoints.

---

## 15) Request-by-Request QA Checklist (All 211 Requests)

Tick each request after it passes. Grouping/order follows the Postman collection folders.

### Authentication (6)
- [ ] Register with Phone
- [ ] Verify Phone OTP
- [ ] Login
- [ ] Refresh Token
- [ ] Logout
- [ ] Get Active Sessions

### Business (3)
- [ ] Create Business
- [ ] Get Business
- [ ] Get Business Stats

### Customers (6)
- [ ] List Customers
- [ ] Create Customer
- [ ] Get Customer
- [ ] Update Customer
- [ ] Get Customer Stats
- [ ] Generate Due Reminder (WhatsApp)

### Products (6)
- [ ] List Products
- [ ] Create Product
- [ ] Get Product
- [ ] Update Product
- [ ] Get Low Stock Products
- [ ] Get Product Stats

### Sales (2)
- [ ] Create Sale
- [ ] List Sales

### Due Transactions (3)
- [ ] Create Due Transaction (BAKI)
- [ ] Create Due Transaction (Payment)
- [ ] List Due Transactions

### Expenses (2)
- [ ] Create Expense
- [ ] List Expenses

### Reports (4)
- [ ] Dashboard Summary
- [ ] Daily Sales Report
- [ ] Aged Dues Report
- [ ] Stock Alert Report

### AI Features (2)
- [ ] Parse Voice Command (Bengali)
- [ ] Chat with AI Assistant

### Auth - Extended (7)
- [ ] Register with Email
- [ ] Verify Email OTP
- [ ] Resend Email Verification
- [ ] Logout All Devices
- [ ] Revoke Session
- [ ] Forgot Password
- [ ] Reset Password

### User (8)
- [ ] Get Me
- [ ] Update Me
- [ ] Change Password
- [ ] Update Preferences
- [ ] Complete Onboarding Step
- [ ] Get Onboarding State
- [ ] Skip Onboarding
- [ ] Activity Log

### Business - Extended (12)
- [ ] List Businesses
- [ ] Update Business
- [ ] Archive Business
- [ ] Delete Business
- [ ] Get Business Settings
- [ ] Update Business Settings
- [ ] Get Business Onboarding
- [ ] Update Business Onboarding Step
- [ ] Complete Business Onboarding
- [ ] Mark Sample Data Loaded
- [ ] List Incomplete Onboardings
- [ ] Business Onboarding Stats

### Products - Extended (3)
- [ ] Delete Product
- [ ] Import Products CSV
- [ ] Download Product Import Template

### Customers - Extended (2)
- [ ] Customer Due History
- [ ] Customer Ledger

### Sales - Extended (11)
- [ ] Create Sale via NLP
- [ ] Create Sale via Voice
- [ ] Get Sale
- [ ] Get Sale Invoice
- [ ] Apply Sale Discount
- [ ] Update Sale Payment Status
- [ ] Cancel Sale
- [ ] Today Sales
- [ ] Sales Stats
- [ ] Daily Sales Summary
- [ ] Top Products

### Sale Returns (5)
- [ ] List Sale Returns
- [ ] Create Sale Return
- [ ] Get Sale Return
- [ ] Void Sale Return
- [ ] Sale Return Stats

### Category (6)
- [ ] List Categories
- [ ] Create Business Category
- [ ] Get Business Categories
- [ ] Update Category
- [ ] Delete Category
- [ ] Category Tree

### Category Requests (14)
- [ ] Submit Request
- [ ] Confirm Request
- [ ] Cancel Request
- [ ] My Requests
- [ ] Business Requests
- [ ] Get Request
- [ ] Pending Requests
- [ ] Requests By Status
- [ ] Start Review
- [ ] Make Decision
- [ ] Reject Request
- [ ] Suggest Existing Category
- [ ] Search Requests
- [ ] Category Request Stats

### Coupons (10)
- [ ] List Coupons
- [ ] Create Coupon
- [ ] Get Coupon
- [ ] Update Coupon
- [ ] Delete Coupon
- [ ] Validate Coupon
- [ ] Apply Coupon
- [ ] Coupon Stats
- [ ] Activate Coupon
- [ ] Deactivate Coupon

### Discounts (4)
- [ ] List Discounts
- [ ] Discount Stats
- [ ] Get Discount
- [ ] Discount Summary

### Due Transactions - Extended (7)
- [ ] Create Adjustment
- [ ] Aged Dues
- [ ] Due Summary
- [ ] Customers With Due
- [ ] Get Due Transaction
- [ ] Customer Due Ledger
- [ ] Void Due Transaction

### Expenses - Extended (7)
- [ ] Get Expense
- [ ] Update Expense
- [ ] Delete Expense
- [ ] Expense Categories
- [ ] Create Expense Category
- [ ] Expense Summary
- [ ] Expense Breakdown

### Reports - Extended (8)
- [ ] Weekly Report
- [ ] Monthly Report
- [ ] Product Profit Report
- [ ] Expense Breakdown Report
- [ ] Net Profit Report
- [ ] Due Ledger Report
- [ ] Export Report
- [ ] Custom Report

### Inventory (5)
- [ ] List Inventory Logs
- [ ] Adjust Inventory
- [ ] Product History
- [ ] Inventory Summary
- [ ] Inventory Alerts

### Notifications (7)
- [ ] List Notifications
- [ ] Mark Notification Read
- [ ] Mark All Read
- [ ] Unread Count
- [ ] Delete Notification
- [ ] Get Notification Preferences
- [ ] Update Notification Preferences

### Payments (14)
- [ ] Legacy (Deprecated) / Initiate Payment
- [ ] Legacy (Deprecated) / Payment Callback
- [ ] Legacy (Deprecated) / Verify Payment
- [ ] Legacy (Deprecated) / Payment History
- [ ] Intent v2 (Primary) / Initialize Payment Intent
- [ ] Intent v2 (Primary) / Submit TrxID
- [ ] Intent v2 (Primary) / Payment Intent Status
- [ ] Intent v2 (Primary) / Resubmit Payment Intent
- [ ] Admin and Manual Ops / Record Manual Payment
- [ ] Admin and Manual Ops / Admin Manual Review Queue
- [ ] Admin and Manual Ops / Admin Verify Manual
- [ ] Admin and Manual Ops / Admin Reject Manual
- [ ] Admin and Manual Ops / Admin Fraud Flags
- [ ] Admin and Manual Ops / Admin Revoke Device

### Subscriptions (9)
- [ ] Get Plans
- [ ] Current Subscription
- [ ] Upgrade Subscription
- [ ] Downgrade Subscription
- [ ] Cancel Downgrade
- [ ] Accept Trial 2
- [ ] Validate Downgrade
- [ ] Plan Limits
- [ ] Referral Status

### Support Tickets (6)
- [ ] List My Tickets
- [ ] Create Ticket
- [ ] Get Ticket
- [ ] Add Ticket Message
- [ ] Close Ticket
- [ ] Reopen Ticket

### AI - Extended (12)
- [ ] AI Voice Query
- [ ] AI Conversations
- [ ] Get AI Conversation
- [ ] Delete AI Conversation
- [ ] Parse & Execute - Step 1 (No confirmationToken)
- [ ] Parse & Execute - Step 2 (Financial with confirmationToken + idempotencyKey)
- [ ] Voice Session Flow (Phase 1-3) / 1) Create Voice Session
- [ ] Voice Session Flow (Phase 1-3) / 2) Transcribe Draft
- [ ] Voice Session Flow (Phase 1-3) / 3) Edit Draft
- [ ] Voice Session Flow (Phase 1-3) / 4) Confirm Draft
- [ ] Voice Session Flow (Phase 1-3) / 5) Parse Preview
- [ ] Voice Session Flow (Phase 1-3) / 6) Execute Low Risk

### AI Regression Scenarios (5)
- [ ] SETUP 1 - Get Confirmation Token
- [ ] NEG-01 Invalid Confirmation Token
- [ ] SETUP 2 - Execute Financial Command Once
- [ ] NEG-02 Duplicate Idempotency Replay
- [ ] NEG-03 Quota Reached (AI Chat)

### Data Export (3)
- [ ] Request Export
- [ ] Verify Export OTP
- [ ] Download Export

### Admin (16)
- [ ] Admin List Users
- [ ] Admin User Details
- [ ] Admin Suspend User
- [ ] Admin Unsuspend User
- [ ] Admin Extend Trial
- [ ] Admin Complimentary Upgrade
- [ ] Admin Reset Password
- [ ] Admin Update Role
- [ ] Admin Export Users CSV
- [ ] Admin List Tickets
- [ ] Admin Assign Ticket
- [ ] Admin Respond Ticket
- [ ] Admin Internal Note
- [ ] Admin Escalate Ticket
- [ ] Admin Audit Logs
- [ ] Admin System Stats
