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

#### Auth Reset Regression (persistence + edge behaviors)
- [ ] Forgot Password returns OTP TTL (`expiresInSeconds`) for valid `phoneOrEmail`
- [ ] Frontend persists `passwordReset.phoneOrEmail` and `passwordReset.otpExpiresAt`
- [ ] Reload before expiry restores OTP step with same `phoneOrEmail`
- [ ] Expired OTP returns expected failure and UI enters resend mode
- [ ] Repeated forgot-password hits backend cooldown (`429`) and UI shows retry window
- [ ] Repeated invalid OTP hits verification lock (`429`) and blocks reset temporarily
- [ ] Successful reset clears `passwordReset.*` persistence keys

Traceability: `API_Design.md` section `1.11`, `SRSv2.md` section `17.4`.

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

