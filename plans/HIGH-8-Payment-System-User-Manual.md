# DokaniAI Payment System — User Manual

> **Version**: v1.0 + v1.1  
> **Last Updated**: April 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [For Admin — Subscription Payment Collection (v1.0)](#2-for-admin--subscription-payment-collection-v10)
3. [For Shopkeeper — Paying Subscription (v1.0)](#3-for-shopkeeper--paying-subscription-v10)
4. [For Admin — Managing Shopkeeper MFS Numbers (v1.1)](#4-for-admin--managing-shopkeeper-mfs-numbers-v11)
5. [For Shopkeeper — Due Payment Auto-Collection (v1.1)](#5-for-shopkeeper--due-payment-auto-collection-v11)
6. [Troubleshooting](#6-troubleshooting)
7. [FAQ](#7-faq)

---

## 1. System Overview

DokaniAI uses **SMS-based payment verification** instead of traditional payment gateways. When someone sends money via bKash/Nagad/Rocket, the MFS provider sends an SMS confirmation. DokaniAI's Android apps capture these SMS messages and automatically verify payments.

### Two Phases

| Phase | What | Who Pays | Who Receives |
|-------|------|----------|--------------|
| **v1.0** | Subscription payments | Shopkeeper → Admin | Admin's bKash/Nagad/Rocket |
| **v1.1** | Customer due payments | Customer → Shopkeeper | Shopkeeper's bKash/Nagad/Rocket |

### Apps Involved

| App | Who Uses | Purpose |
|-----|----------|---------|
| **DokaniAI Web** | Admin + Shopkeeper | Dashboard, settings, due ledger |
| **DokaniAI Admin Helper** (Android) | Admin's phone | Captures subscription payment SMS |
| **DokaniAI Shopkeeper** (Android) | Shopkeeper's phone | Captures customer due payment SMS |

---

## 2. For Admin — Subscription Payment Collection (v1.0)

### 2.1 Initial Setup (One-Time)

**Step 1: Configure Admin MFS Numbers**

Add your personal bKash, Nagad, and Rocket numbers in the backend configuration:

```properties
# application.properties or environment variables
dokaniai.payment.mfs.admin-numbers.bkash=01XXXXXXXXX
dokaniai.payment.mfs.admin-numbers.nagad=01XXXXXXXXX
dokaniai.payment.mfs.admin-numbers.rocket=01XXXXXXXXX
```

These are the numbers where shopkeepers will send subscription payments.

**Step 2: Install Admin Helper Android App**

1. Build the APK from `/DokaniAI-PaymentHelper-Android/` or receive it from your developer
2. Install on a dedicated Android phone that stays near you
3. This phone must have the SIM card for your bKash/Nagad/Rocket numbers

**Step 3: Bootstrap the Admin App**

1. Open the DokaniAI web dashboard as admin
2. Go to **Admin Workspace → Payments** tab
3. Click **"Bootstrap New Device"** button
4. A QR code will appear — scan it with the Android app's camera
5. The app is now linked to your admin account

> 📱 **Tip**: Keep this phone charged and connected to internet. The app runs a foreground service that continuously monitors incoming SMS.

### 2.2 How Subscription Payment Works (Automatic)

When a shopkeeper pays for their subscription:

```
┌─────────────┐    1. Send Money     ┌──────────────┐
│  Shopkeeper  │ ──────────────────► │  Admin's     │
│  (bKash app) │    ৳149 to Admin    │  bKash/Nagad │
└─────────────┘                      └──────┬───────┘
                                            │
                                     2. SMS Confirmation
                                            │
                                     ┌──────▼───────┐
                                     │  Admin Helper │
                                     │  Android App  │
                                     │  (captures SMS)│
                                     └──────┬───────┘
                                            │
                                     3. Sends to Server
                                            │
                                     ┌──────▼───────┐
                                     │  DokaniAI     │
                                     │  Backend      │
                                     │  (auto-match) │
                                     └──────┬───────┘
                                            │
                              4. Payment verified ✓
                              Subscription activated ✓
```

**What happens automatically:**
1. Shopkeeper sends money via bKash/Nagad/Rocket
2. MFS provider sends SMS to admin's phone
3. Admin Helper app captures the SMS
4. App sends parsed data to DokaniAI server
5. Server matches: TrxID + Amount ±0.01 + MFS method + 5-minute window
6. If matched → Payment auto-verified, subscription activated
7. If not matched → Goes to Manual Review queue

### 2.3 Managing Manual Reviews

Sometimes payments need manual review (wrong amount, delayed SMS, etc.):

1. Go to **Admin Workspace → Payments → Review Queue**
2. You'll see payments with user info, amount, TrxID, and timestamps
3. Click **"Verify"** to approve, or **"Reject"** to deny
4. When verifying, you can select an SMS report from the SMS Pool to link

### 2.4 Monitoring Dashboard

The **Payments** tab shows:
- **Summary KPIs**: Today's revenue, total completed, manual review count, fraud flags, auto-verified rate
- **Review Queue**: Payments needing manual action
- **Fraud Flags**: Suspicious payments (multiple failed attempts)
- **Devices**: Registered Android devices with status
- **SMS Pool**: All unmatched SMS reports

---

## 3. For Shopkeeper — Paying Subscription (v1.0)

### 3.1 How to Pay

**Step 1: Initiate Payment**

1. Log into DokaniAI web app
2. Go to **Settings → Subscription**
3. Click **"Upgrade"** or **"Renew"**
4. Select your plan and MFS method (bKash/Nagad/Rocket)
5. You'll see:
   - Amount to pay (e.g., ৳149)
   - Admin's MFS number to send to
   - A payment timer (30 minutes to complete)

**Step 2: Send Money**

1. Open your bKash/Nagad/Rocket app
2. Send the **exact amount** to the number shown
3. **Important**: Copy the TrxID from the confirmation

**Step 3: Submit TrxID**

1. Go back to DokaniAI
2. Enter the TrxID in the payment page
3. Click **"Submit"**

**Step 4: Wait for Verification**

- If auto-verified (usually within 1-2 minutes): ✅ Subscription activated!
- If manual review needed: ⏳ Wait for admin to verify (usually within 24 hours)

### 3.2 Example Walkthrough

```
Rahim wants to upgrade to Basic plan (৳149/month):

1. Rahim opens DokaniAI → Settings → Subscription → "Upgrade to Basic"
2. Selects "bKash" as payment method
3. Sees: "Send ৳149 to 01XXXXXXXXX (Admin bKash)"
4. Opens bKash app → Send Money → 01XXXXXXXXX → ৳149
5. Gets TrxID: "DDJ8BQBVCM"
6. Goes back to DokaniAI → Enters "DDJ8BQBVCM" → Submit
7. Within 1-2 minutes: "✅ Payment verified! Basic plan activated."
```

---

## 4. For Admin — Managing Shopkeeper MFS Numbers (v1.1)

### 4.1 What Are Shopkeeper MFS Numbers?

Shopkeepers can register their personal bKash/Nagad/Rocket numbers. Once approved by admin, when a customer sends money to that number, DokaniAI automatically credits it against the customer's due balance.

### 4.2 Approval Workflow

```
Shopkeeper registers MFS number → Status: PENDING
                                        │
                              Admin reviews in Payments tab
                                        │
                            ┌───────────┴───────────┐
                            │                       │
                        APPROVE                  REJECT
                            │                       │
                    Status: APPROVED          Status: REJECTED
                    SMS monitoring active     Shopkeeper notified
```

### 4.3 Step-by-Step for Admin

1. Go to **Admin Workspace → Payments → MFS Numbers** tab
2. You'll see a table of pending registrations:
   - Shopkeeper name and phone
   - MFS type (bKash/Nagad/Rocket)
   - MFS number
   - SIM slot
   - Submission date
3. **To approve**: Click the green **"Approve"** button
   - The shopkeeper's due payment auto-collection will activate
4. **To reject**: Click the red **"Reject"** button
   - You'll be asked to provide a rejection reason
   - The shopkeeper will be notified

### 4.4 Example

```
Shopkeeper "Karim Store" registers:
- bKash: 01XXXXXXXXX (SIM 1)
- Nagad: 01YYYYYYYYY (SIM 2)

Admin sees in MFS Numbers tab:
┌──────────────┬────────┬───────────────┬─────────┬──────────┐
│ User         │ Phone  │ MFS Number    │ Type    │ Actions  │
├──────────────┼────────┼───────────────┼─────────┼──────────┤
│ Karim Store  │ 01Z... │ 01XXXXXXXXX   │ bKash   │ ✓ ✗      │
│ Karim Store  │ 01Z... │ 01YYYYYYYYY   │ Nagad   │ ✓ ✗      │
└──────────────┴────────┴───────────────┴─────────┴──────────┘

Admin clicks ✓ (Approve) for both → Both numbers now active for SMS matching.
```

### 4.5 Rules

- Each shopkeeper can register **maximum 2 MFS numbers**
- Only APPROVED numbers trigger due payment auto-matching
- Admin can reject with a reason (shopkeeper sees the reason)
- Shopkeeper can re-register after rejection

---

## 5. For Shopkeeper — Due Payment Auto-Collection (v1.1)

### 5.1 Overview

When your customer sends money to your registered bKash/Nagad/Rocket number, DokaniAI automatically:
1. Captures the payment SMS
2. Identifies the customer by their phone number
3. Creates a JOMA (payment received) entry in the due ledger
4. Updates the customer's running balance

### 5.2 Setup (One-Time)

**Step 1: Register Your MFS Numbers**

1. Log into DokaniAI web app
2. Go to **Settings → MFS Numbers** (or use the Android app)
3. Click **"Add MFS Number"**
4. Fill in:
   - MFS Provider: bKash / Nagad / Rocket
   - Phone Number: Your MFS number (e.g., 01XXXXXXXXX)
   - SIM Slot: SIM 1 or SIM 2
5. Click **"Submit for Approval"**
6. Status shows **"Pending"** — wait for admin approval

**Step 2: Install Shopkeeper Android App**

1. Build the APK from `/DokaniAI-PaymentShopkeeper-Android/` or receive from admin
2. Install on your Android phone with the SIM card for your MFS numbers
3. Open the app → Enter your phone number → Send OTP → Verify
4. The app starts monitoring SMS for your approved MFS numbers

**Step 3: Wait for Admin Approval**

Once admin approves your MFS numbers, auto-collection activates.

### 5.3 How Auto-Collection Works

```
┌─────────────┐    1. Send Money     ┌──────────────┐
│  Customer    │ ──────────────────► │  Shopkeeper's │
│  (bKash app) │    ৳500 due payment │  bKash/Nagad  │
└─────────────┘                      └──────┬───────┘
                                            │
                                     2. SMS Confirmation
                                            │
                                     ┌──────▼───────┐
                                     │  Shopkeeper   │
                                     │  Android App  │
                                     │  (captures SMS)│
                                     └──────┬───────┘
                                            │
                                     3. Sends to Server
                                            │
                                     ┌──────▼───────┐
                                     │  DokaniAI     │
                                     │  Backend      │
                                     │  (auto-match) │
                                     └──────┬───────┘
                                            │
                              4. Finds customer by phone
                              5. Creates JOMA transaction
                              6. Updates due balance
```

### 5.4 Example Walkthrough

```
Customer "Abul" owes ৳1,200 to "Karim Store":

1. Abul opens bKash → Send Money → Karim's bKash (01XXXXXXXXX) → ৳500
2. bKash sends SMS to Karim's phone
3. Shopkeeper app captures SMS, extracts: Amount=৳500, Sender=01AAAAA, TxnID=754PTHMR
4. App sends to DokaniAI server
5. Server finds:
   - Karim's bKash 01XXXXXXXXX is APPROVED ✓
   - Customer with phone 01AAAAA exists in Karim's business ✓
   - Customer has ৳1,200 due balance ✓
6. Server creates:
   - DueTransaction: JOMA ৳500 (AUTO_MFS, TxnID: 754PTHMR)
   - Customer balance: ৳1,200 - ৳500 = ৳700
7. Karim sees in Due Ledger: "Auto-credited via bKash (TxnID: 754PTHMR)"
```

### 5.5 What You See in Due Ledger

In the DokaniAI web app's Due Ledger, auto-credited payments appear with:

| Field | Manual Entry | Auto MFS Entry |
|-------|-------------|----------------|
| Type | JOMA | JOMA |
| Amount | ৳500 | ৳500 |
| Recorded Via | MANUAL | AUTO_MFS |
| Description | "Cash payment from Abul" | "Auto-credited via bKash (TxnID: 754PTHMR)" |
| Reference | Sale #XXX | MFS SMS Report #YYY |

### 5.6 Important Notes

- **Phone matching**: Customer must be registered with the same phone number they use for bKash/Nagad/Rocket
- **Partial payments**: If customer sends ৳500 but owes ৳1,200, only ৳500 is credited (remaining ৳700 stays as due)
- **Over-payment**: If customer sends ৳1,500 but only owes ৳1,200, only ৳1,200 is credited (৳300 excess is NOT auto-handled)
- **Max 2 numbers**: You can register up to 2 MFS numbers total (any combination of bKash/Nagad/Rocket)
- **Internet required**: The Android app needs internet to sync SMS data to the server

---

## 6. Troubleshooting

### Payment Not Auto-Verified

| Possible Cause | Solution |
|---------------|----------|
| Wrong amount sent | Must match exactly (±৳0.01 tolerance) |
| Wrong MFS number | Must send to admin's configured number |
| TrxID not submitted | Shopkeeper must enter TrxID in web app |
| SMS not captured | Check Android app is running, foreground notification visible |
| No internet on phone | App queues SMS offline, syncs when internet returns |
| More than 5 minutes delay | SMS must arrive within 5 minutes of TrxID submission |

### Due Payment Not Auto-Credited

| Possible Cause | Solution |
|---------------|----------|
| MFS number not approved | Check status in Settings → MFS Numbers |
| Customer phone doesn't match | Customer's DokaniAI phone must match their bKash sender number |
| Customer has no due | Auto-credit only works if customer has outstanding balance |
| SMS not captured | Check Android app is running with foreground notification |
| Shopkeeper app not logged in | Re-login with OTP if session expired |

### Android App Issues

| Issue | Solution |
|-------|----------|
| App closes in background | Disable battery optimization for the app |
| SMS not captured | Grant SMS permission, check app has foreground notification |
| "Device not registered" | Re-bootstrap (Admin) or re-login (Shopkeeper) |
| Sync not working | Check internet connection, try manual sync in Settings |

---

## 7. FAQ

**Q: Do I need a separate phone for the Android app?**  
A: Ideally yes. The phone should stay powered on with the MFS SIM card inserted. For admin, a dedicated phone is recommended. For shopkeepers, their regular phone works fine.

**Q: What if I have multiple SIM cards?**  
A: The app supports SIM slot selection. When registering an MFS number, specify SIM 1 or SIM 2.

**Q: Is my payment data secure?**  
A: Yes. SMS data is transmitted over HTTPS, stored encrypted in the database, and API keys/JWT tokens are stored in Android's encrypted keystore.

**Q: What happens if the same SMS is processed twice?**  
A: The server deduplicates by SMS hash and TrxID. Duplicate submissions are ignored.

**Q: Can a shopkeeper have both bKash and Nagad?**  
A: Yes, up to 2 MFS numbers total. Any combination: 2 bKash, or 1 bKash + 1 Nagad, etc.

**Q: How long does auto-verification take?**  
A: Typically 10-30 seconds from SMS arrival to payment verification, assuming internet is available.

**Q: What if there's no internet?**  
A: The Android app stores SMS in a local Room database and syncs when internet returns. No SMS is lost.

**Q: Can admin see all shopkeeper MFS numbers?**  
A: Admin sees pending registrations in the Payments tab. Approved/rejected numbers are managed through the same interface.

---

## Quick Reference Card

### For Admin
| Action | Where |
|--------|-------|
| Configure MFS numbers | Backend `application.properties` |
| Bootstrap Android app | Admin Workspace → Payments → Devices |
| Review payments | Admin Workspace → Payments → Review Queue |
| Approve shopkeeper MFS | Admin Workspace → Payments → MFS Numbers |
| Monitor dashboard | Admin Workspace → Payments → Summary |

### For Shopkeeper
| Action | Where |
|--------|-------|
| Pay subscription | Web App → Settings → Subscription → Upgrade |
| Register MFS number | Web App → Settings → MFS Numbers |
| Check due ledger | Web App → Due Ledger |
| View auto-credits | Due Ledger → Look for "AUTO_MFS" entries |
| Install Android app | Build from `/DokaniAI-PaymentShopkeeper-Android/` |
