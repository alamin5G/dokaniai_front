# DokaniAI Complete Architecture Document

## Complete Flow, Plans, and System Design

Version: 1.0 | Date: April 2025 | Status: Final

---

# Table of Contents

1. [Subscription Plans & Pricing](#1-subscription-plans--pricing)
2. [Feature Matrix](#2-feature-matrix)
3. [AI Query Limits & Character Limits](#3-ai-query-limits--character-limits)
4. [Voice vs NLP vs AI Chatbot Flow](#4-voice-vs-nlp-vs-ai-chatbot-flow)
5. [Subscription Purchase Architecture](#5-subscription-purchase-architecture)
6. [User Scenarios](#6-user-scenarios)
7. [Complete Architecture Flow](#7-complete-architecture-flow)
8. [Page Structure](#8-page-structure)
9. [UI States for Pricing Cards](#9-ui-states-for-pricing-cards)
10. [Session Storage Strategy](#10-session-storage-strategy)
11. [Mobile Considerations](#11-mobile-considerations)
12. [Cost Analysis](#12-cost-analysis)
13. [Design Guidelines](#13-design-guidelines)

---

# 1. Subscription Plans & Pricing

## 1.1 Plan Definitions (TypeScript)

```typescript
const plans = [
  {
    id: "FREE_TRIAL_1",
    name: "ফ্রি ট্রায়াল ১",
    nameEn: "Free Trial 1",
    price: 0,
    currency: "BDT",
    duration: 65,
    durationUnit: "days",
    businesses: 1,
    productsPerBusiness: 10,
    aiQueriesPerDay: 5,
    maxQueryChars: 150,
    isFree: true,
    highlight: false,
    badge: null,
    ctaText: "শুরু করুন",
    features: {
      voiceInput: true,
      dueManagement: true,
      discountManagement: true,
      emailSupport: true,
      whatsappReminder: false,
      advancedReports: false,
      pdfExport: false,
      prioritySupport: false,
      dataExport: false,
      bulkImport: false,
    }
  },
  {
    id: "FREE_TRIAL_2",
    name: "ফ্রি ট্রায়াল ২",
    nameEn: "Free Trial 2",
    price: 0,
    currency: "BDT",
    duration: 35,
    durationUnit: "days",
    businesses: 2,
    productsPerBusiness: 20,
    aiQueriesPerDay: 5,
    maxQueryChars: 150,
    isFree: true,
    highlight: false,
    badge: "FT1 শেষে অফার",
    ctaText: "FT1 শেষে",
    features: {
      voiceInput: true,
      dueManagement: true,
      discountManagement: true,
      emailSupport: true,
      whatsappReminder: false,
      advancedReports: false,
      pdfExport: false,
      prioritySupport: false,
      dataExport: false,
      bulkImport: false,
    }
  },
  {
    id: "BASIC",
    name: "বেসিক",
    nameEn: "Basic",
    price: 149,
    currency: "BDT",
    duration: 1,
    durationUnit: "month",
    businesses: 1,
    productsPerBusiness: 100,
    aiQueriesPerDay: 25,
    maxQueryChars: 200,
    isFree: false,
    highlight: false,
    badge: null,
    ctaText: "কিনুন",
    features: {
      voiceInput: true,
      dueManagement: true,
      discountManagement: true,
      emailSupport: true,
      whatsappReminder: true,
      advancedReports: true,
      pdfExport: true,
      prioritySupport: false,
      dataExport: false,
      bulkImport: false,
    }
  },
  {
    id: "PRO",
    name: "প্রো",
    nameEn: "Pro",
    price: 399,
    currency: "BDT",
    duration: 1,
    durationUnit: "month",
    businesses: 3,
    productsPerBusiness: 200,
    aiQueriesPerDay: 75,
    maxQueryChars: 350,
    isFree: false,
    highlight: true,
    badge: "জনপ্রিয়",
    ctaText: "কিনুন",
    features: {
      voiceInput: true,
      dueManagement: true,
      discountManagement: true,
      emailSupport: true,
      whatsappReminder: true,
      advancedReports: true,
      pdfExport: true,
      prioritySupport: false,
      dataExport: false,
      bulkImport: true,
    }
  },
  {
    id: "PLUS",
    name: "প্লাস",
    nameEn: "Plus",
    price: 799,
    currency: "BDT",
    duration: 1,
    durationUnit: "month",
    businesses: 7,
    productsPerBusiness: "Unlimited",
    aiQueriesPerDay: 300,  // Soft limit, display as "Unlimited"
    maxQueryChars: 600,
    isFree: false,
    highlight: false,
    badge: null,
    ctaText: "কিনুন",
    features: {
      voiceInput: true,
      dueManagement: true,
      discountManagement: true,
      emailSupport: true,
      whatsappReminder: true,
      advancedReports: true,
      pdfExport: true,
      prioritySupport: true,
      dataExport: true,
      bulkImport: true,
    }
  },
  {
    id: "ENTERPRISE",
    name: "এন্টারপ্রাইজ",
    nameEn: "Enterprise",
    price: null,
    currency: "BDT",
    duration: 1,
    durationUnit: "year",
    businesses: "Unlimited",
    productsPerBusiness: "Unlimited",
    aiQueriesPerDay: "Unlimited",
    maxQueryChars: 2000,
    isFree: false,
    highlight: false,
    badge: "যোগাযোগ করুন",
    ctaText: "যোগাযোগ",
    features: {
      voiceInput: true,
      dueManagement: true,
      discountManagement: true,
      emailSupport: true,
      whatsappReminder: true,
      advancedReports: true,
      pdfExport: true,
      prioritySupport: true,
      dataExport: true,
      bulkImport: true,
      apiAccess: true,
      customAITraining: true,
      dedicatedSupport: true,
      slaGuarantee: true,
    }
  }
];
```

## 1.2 Quick Reference Table

| Plan | Price | Duration | Businesses | Products | AI/Day | CTA |
|------|-------|----------|------------|----------|--------|-----|
| **ফ্রি ট্রায়াল ১** | ৳০ | ৬৫ দিন | ১ | ১০ | ৫ | শুরু করুন |
| **ফ্রি ট্রায়াল ২** | ৳০ | ৩৫ দিন | ২ | ২০ | ৫ | FT1 শেষে |
| **বেসিক** | ৳১৪৯/মাস | মাসিক | ১ | ১০০ | ২৫ | কিনুন |
| **প্রো** ⭐ | ৳৩৯৯/মাস | মাসিক | ৩ | ২০০ | ৭৫ | কিনুন |
| **প্লাস** | ৳৭৯৯/মাস | মাসিক | ৭ | ∞ | ∞ | কিনুন |
| **এন্টারপ্রাইজ** | Custom | বার্ষিক | ∞ | ∞ | ∞ | যোগাযোগ |

## 1.3 Free Trial Logic

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FREE TRIAL SEQUENTIAL FLOW                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Registers                                                             │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────┐                                                        │
│  │ Free Trial 1    │ ← 65 days, 1 business, 10 products                    │
│  │ (Auto-assigned) │                                                        │
│  └─────────────────┘                                                        │
│       │                                                                     │
│       │ FT1 Expires                                                         │
│       ▼                                                                     │
│  ┌─────────────────┐                                                        │
│  │ FT2 Offer       │ ← User has 7 days to accept                            │
│  │ (35 days)       │                                                        │
│  └─────────────────┘                                                        │
│       │                                                                     │
│       ├── Accept → FT2 activated (35 days)                                  │
│       │                                                                     │
│       └── Decline/Ignore → Account moves to RESTRICTED state                │
│                          → FT2 never offered again                          │
│                                                                             │
│  Note: No user may receive either free tier more than once                  │
│        per phone number + device fingerprint                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. Feature Matrix

## 2.1 Complete Feature Matrix (TypeScript)

```typescript
const features = [
  // Core Features (All Plans)
  { id: "products_sales", name: "পণ্য ও বিক্রয়", nameEn: "Products & Sales", 
    free: true, basic: true, pro: true, plus: true, enterprise: true },
  
  { id: "expense_tracking", name: "খরচ ট্র্যাকিং", nameEn: "Expense Tracking", 
    free: true, basic: true, pro: true, plus: true, enterprise: true },
  
  { id: "basic_reports", name: "বেসিক রিপোর্ট", nameEn: "Basic Reports", 
    free: true, basic: true, pro: true, plus: true, enterprise: true },
  
  // Previously Premium, Now Free
  { id: "due_management", name: "বাকী খাতা", nameEn: "Due Management", 
    free: true, basic: true, pro: true, plus: true, enterprise: true },
  
  { id: "discount_management", name: "ডিসকাউন্ট ম্যানেজমেন্ট", nameEn: "Discount Management", 
    free: true, basic: true, pro: true, plus: true, enterprise: true },
  
  { id: "email_support", name: "ইমেইল সাপোর্ট", nameEn: "Email Support", 
    free: true, basic: true, pro: true, plus: true, enterprise: true },
  
  // Voice Input (FREE - Local STT)
  { id: "voice_input", name: "ভয়েস ইনপুট", nameEn: "Voice Input", 
    free: true, basic: true, pro: true, plus: true, enterprise: true,
    note: "FREE - Uses local BanglaSpeech2Text" },
  
  // AI Features (Limited by Plan)
  { id: "ai_queries", name: "AI কুয়েরি", nameEn: "AI Queries", 
    free: "৫/দিন", basic: "২৫/দিন", pro: "৭৫/দিন", plus: "আনলিমিটেড", enterprise: "আনলিমিটেড" },
  
  // Premium Features (Basic+)
  { id: "whatsapp_reminder", name: "WhatsApp রিমাইন্ডার", nameEn: "WhatsApp Reminder", 
    free: false, basic: true, pro: true, plus: true, enterprise: true },
  
  { id: "advanced_analytics", name: "অ্যাডভান্সড রিপোর্ট", nameEn: "Advanced Analytics", 
    free: false, basic: true, pro: true, plus: true, enterprise: true },
  
  { id: "pdf_export", name: "PDF এক্সপোর্ট", nameEn: "PDF Export", 
    free: false, basic: true, pro: true, plus: true, enterprise: true },
  
  // Pro+ Features
  { id: "bulk_import", name: "বাল্ক পণ্য ইম্পোর্ট", nameEn: "Bulk Product Import", 
    free: false, basic: false, pro: true, plus: true, enterprise: true },
  
  // Plus+ Features
  { id: "priority_support", name: "প্রায়োরিটি সাপোর্ট", nameEn: "Priority Support", 
    free: false, basic: false, pro: false, plus: true, enterprise: true },
  
  { id: "data_export", name: "ডেটা এক্সপোর্ট (CSV/JSON)", nameEn: "Data Export", 
    free: false, basic: false, pro: false, plus: true, enterprise: true },
  
  // Enterprise Features
  { id: "api_access", name: "API অ্যাক্সেস", nameEn: "API Access", 
    free: false, basic: false, pro: false, plus: false, enterprise: true },
  
  { id: "custom_ai", name: "কাস্টম AI ট্রেনিং", nameEn: "Custom AI Training", 
    free: false, basic: false, pro: false, plus: false, enterprise: true },
  
  { id: "dedicated_support", name: "ডেডিকেটেড সাপোর্ট", nameEn: "Dedicated Support", 
    free: false, basic: false, pro: false, plus: false, enterprise: true },
  
  { id: "sla_guarantee", name: "SLA গ্যারান্টি", nameEn: "SLA Guarantee", 
    free: false, basic: false, pro: false, plus: false, enterprise: true },
];
```

## 2.2 Feature Matrix Table

| Feature | Free | Basic | Pro | Plus | Enterprise |
|---------|------|-------|-----|------|------------|
| পণ্য ও বিক্রয় | ✓ | ✓ | ✓ | ✓ | ✓ |
| খরচ ট্র্যাকিং | ✓ | ✓ | ✓ | ✓ | ✓ |
| বেসিক রিপোর্ট | ✓ | ✓ | ✓ | ✓ | ✓ |
| বাকী খাতা | ✓ | ✓ | ✓ | ✓ | ✓ |
| ডিসকাউন্ট | ✓ | ✓ | ✓ | ✓ | ✓ |
| ইমেইল সাপোর্ট | ✓ | ✓ | ✓ | ✓ | ✓ |
| ভয়েস ইনপুট | ✓ | ✓ | ✓ | ✓ | ✓ |
| AI কুয়েরি | ৫/দিন | ২৫/দিন | ৭৫/দিন | ∞ | ∞ |
| WhatsApp রিমাইন্ডার | ✗ | ✓ | ✓ | ✓ | ✓ |
| অ্যাডভান্সড রিপোর্ট | ✗ | ✓ | ✓ | ✓ | ✓ |
| PDF এক্সপোর্ট | ✗ | ✓ | ✓ | ✓ | ✓ |
| বাল্ক ইম্পোর্ট | ✗ | ✗ | ✓ | ✓ | ✓ |
| প্রায়োরিটি সাপোর্ট | ✗ | ✗ | ✗ | ✓ | ✓ |
| ডেটা এক্সপোর্ট | ✗ | ✗ | ✗ | ✓ | ✓ |
| API অ্যাক্সেস | ✗ | ✗ | ✗ | ✗ | ✓ |
| কাস্টম AI | ✗ | ✗ | ✗ | ✗ | ✓ |
| ডেডিকেটেড সাপোর্ট | ✗ | ✗ | ✗ | ✗ | ✓ |
| SLA গ্যারান্টি | ✗ | ✗ | ✗ | ✗ | ✓ |

---

# 3. AI Query Limits & Character Limits

## 3.1 AI Query Limits by Plan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AI QUERY LIMITS                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Plan          Queries/Day    Max Tokens/Query    Conversation History     │
│  ────────────  ────────────   ─────────────────    ────────────────────     │
│  Free Trial    5               1,000               Last 3 turns             │
│  Basic         25              2,000               Last 10 turns            │
│  Pro           75              4,000               Last 20 turns            │
│  Plus          300 (soft)      8,000               Last 50 turns            │
│  Enterprise    Unlimited       16,000              Full history             │
│                                                                             │
│  Note: Plus displays "Unlimited" but has 300/day soft limit                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Character Limits by Plan

| Plan | Max Query Chars | Max Tokens | Reasoning |
|------|-----------------|------------|-----------|
| Free Trial | 150 | ~1,000 | Prevent abuse |
| Basic | 200 | ~2,000 | Moderate usage |
| Pro | 350 | ~4,000 | Flexible queries |
| Plus | 600 | ~8,000 | Complex questions |
| Enterprise | 2,000 | ~16,000 | Full access |

## 3.3 Token Calculation Method

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TOKEN CALCULATION                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Bengali text:    ~1.5-2 tokens per character                               │
│  English text:    ~0.25 tokens per character                                │
│  System prompt:   ~50 tokens (fixed)                                        │
│  Context (RAG):   ~200 tokens                                               │
│                                                                             │
│  Example (Free User - 150 chars Bengali):                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  User input:    150 × 2 = 300 tokens                                        │
│  System prompt:           50 tokens                                         │
│  Context:                200 tokens                                         │
│  Response (avg):         300 tokens                                         │
│  ────────────────────────────────────────                                   │
│  Total per query:       ~850 tokens                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 4. Voice vs NLP vs AI Chatbot Flow

## 4.1 System Flow Clarification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SYSTEM FLOW CLARIFICATION                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  ১. VOICE INPUT (ভয়েস ইনপুট)                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  User speaks → BanglaSpeech2Text (Port 5000) → Bengali Text                │
│                                                                             │
│  📍 Location: Python Flask Service (Docker)                                 │
│  💰 Cost: 100% FREE (local processing)                                      │
│  ⚡ No API limit needed - runs on your VPS                                  │
│  🔧 Model: small (~1GB, WER: 18%)                                           │
│                                                                             │
│  Example:                                                                   │
│  User says: "চাল বিশ কেজি বিক্রি বারোশ টাকায়"                               │
│  Output:    "চাল ২০ কেজি বিক্রি ১২০০ টাকায়"                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ২. NLP PARSING (টেক্সট পার্সিং)                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Bengali Text → Z.ai GLM-4.7-Flash → Structured JSON                       │
│                                                                             │
│  📍 This is part of AI Query (counts toward daily limit)                   │
│  💰 Cost: Uses GLM-4.7-Flash (FREE but has rate limits: 60 RPM)            │
│                                                                             │
│  Example:                                                                   │
│  Input:  "চাল ২০ কেজি বিক্রি ১২০০ টাকায়"                                    │
│  Output: {                                                                  │
│    "action": "SALE",                                                        │
│    "product": "চাল",                                                        │
│    "quantity": 20,                                                          │
│    "unit": "kg",                                                            │
│    "total_price": 1200,                                                     │
│    "confidence": 0.92                                                       │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  ৩. AI CHATBOT (AI চ্যাটবট)                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  User asks question → Z.ai GLM-4.7-Flash → Response                        │
│                                                                             │
│  📍 This is AI Query (counts toward daily limit)                           │
│  💰 Cost: Uses GLM-4.7-Flash (FREE but has rate limits)                    │
│                                                                             │
│  Example:                                                                   │
│  User: "আজকের বিক্রয় কত?"                                                   │
│  AI:   "আপনার আজকের বিক্রয় ৳১২,৪৫০। গতকালের তুলনায় ১২% বেশি।"            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Key Differences Summary

| Feature | What it does | Where | Cost | Counts as AI Query? |
|---------|--------------|-------|------|---------------------|
| **Voice Input (STT)** | Voice → Text | Python Flask (Docker) | FREE | ❌ No |
| **NLP Parsing** | Text → Structured Data | Z.ai GLM-4.7 | FREE | ✅ Yes |
| **AI Chatbot** | Q&A Conversation | Z.ai GLM-4.7 | FREE | ✅ Yes |

## 4.3 Complete Voice-to-Action Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPLETE VOICE-TO-ACTION FLOW                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │   User      │                                                            │
│  │  Speaks     │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  BANGLASPEECH2TEXT (Port 5000)                                       │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  • Python Flask Service in Docker                                    │   │
│  │  • faster-whisper (CTranslate2)                                      │   │
│  │  • Model: small (~1GB)                                               │   │
│  │  • Runs on VPS (no external API call)                                │   │
│  │  • Cost: FREE                                                        │   │
│  │  • NO daily limit needed                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         │ Bengali Text: "চাল ২০ কেজি বিক্রি ১২০০ টাকায়"                     │
│         ▼                                                                   │
│  ┌─────────────┐                                                            │
│  │  Text Box   │ ← User can edit/correct                                  │
│  │  (Editable) │                                                          │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         │ User clicks "Submit" or presses Enter                             │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CHECK AI QUERY LIMIT                                                │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  if (user.aiQueriesUsedToday >= plan.aiQueriesPerDay) {              │   │
│  │      showError("আজকের AI কুয়েরি সীমা শেষ");                          │   │
│  │      return;                                                         │   │
│  │  }                                                                   │   └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         │ Limit not exceeded                                                │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Z.ai GLM-4.7-FLASH                                                  │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  • Primary LLM (FREE)                                                │   │
│  │  • Parses text → Structured JSON                                     │   │
│  │  • Rate limit: 60 RPM                                                │   │
│  │  • Timeout: 8 seconds                                                │   │
│  │  • Increment user.aiQueriesUsedToday++                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         │ Structured JSON                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CONFIRMATION UI                                                     │   │
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
│  ┌─────────────┐                                                            │
│  │   Save to   │                                                            │
│  │  Database   │                                                            │
│  └─────────────┘                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 5. Subscription Purchase Architecture

## 5.1 Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION PURCHASE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PUBLIC PAGES (No Auth Required)                                            │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Landing Page (/)                                                         │
│  • Pricing Page (/pricing)                                                  │
│  • Login Page (/login)                                                      │
│  • Register Page (/register)                                                │
│  • OTP Verification (/verify-otp)                                           │
│                                                                             │
│  AUTHENTICATED PAGES (Login Required)                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Business Overview (/businesses)                                          │
│  • Shop Workspace (/shop/[businessId]/...)                                  │
│  • Subscription (/subscription)                                             │
│  • Upgrade Flow (/subscription/upgrade)                                     │
│  • Payment Status (/subscription/payment/[id])                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 6. User Scenarios

## 6.1 Scenario A: New User (No Account)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SCENARIO A: NEW USER                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Landing Page → See Pricing → Click "শুরু করুন" → Register                  │
│  → Get FT1 (Auto-assigned) → Onboarding → Dashboard                         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Step 1: User visits Landing Page (/)                                       │
│          └── Sees pricing cards (public, no auth needed)                    │
│                                                                             │
│  Step 2: User clicks "শুরু করুন" on Free Trial card                         │
│          └── Or clicks "কিনুন" on any paid plan                            │
│                                                                             │
│  Step 3: Auth Gate Check                                                    │
│          └── if (isLoggedIn) → Go to appropriate flow                       │
│          └── if (!isLoggedIn) → Show Register Modal                         │
│              └── Store selected_plan_id in sessionStorage                   │
│                                                                             │
│  Step 4: Registration Flow                                                  │
│          ├── Phone/Email entry                                              │
│          ├── OTP verification                                               │
│          ├── Create account                                                 │
│          ├── ✅ AUTO-ASSIGN: Free Trial 1 (65 days)                         │
│          └── Redirect based on stored plan                                  │
│                                                                             │
│  Step 5: Post-Registration Redirect                                         │
│          ├── if (stored_plan_id == FREE_TRIAL_1) → Onboarding               │
│          └── if (stored_plan_id == PAID_PLAN) → Upgrade Flow                │
│                                                                             │
│  Step 6: Onboarding Wizard (for FT1 users)                                  │
│          ├── Welcome screen                                                 │
│          ├── Language selection                                             │
│          ├── Business type selection                                        │
│          ├── Business name entry                                            │
│          ├── Add products (optional)                                        │
│          ├── Tutorial video                                                 │
│          └── → Dashboard (/shop/[businessId])                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6.2 Scenario B: Existing User (Has Account)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SCENARIO B: EXISTING USER                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Landing Page → See Pricing → Click "কিনুন" → Login                        │
│  → Payment Flow → Plan Activated → Dashboard                                │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Step 1: User visits Landing Page (/)                                       │
│          └── Sees pricing cards                                             │
│          └── Pricing cards show different states based on current plan      │
│                                                                             │
│  Step 2: User clicks "কিনুন" on Basic/Pro/Plus                              │
│          └── Auth Gate Check                                                │
│          └── Store selected_plan_id in sessionStorage                       │
│                                                                             │
│  Step 3: Login Flow                                                         │
│          ├── Enter credentials                                              │
│          ├── Verify OTP (if needed)                                         │
│          └── → Redirect to stored plan flow                                 │
│                                                                             │
│  Step 4: Payment Flow (/subscription/upgrade?plan=BASIC)                    │
│          ├── Show plan summary                                              │
│          ├── Show current plan vs new plan comparison                       │
│          ├── Select payment method (bKash/Nagad/Rocket)                     │
│          ├── Show admin MFS number + amount                                 │
│          ├── User sends payment                                             │
│          ├── User enters TrxID                                              │
│          └── Server creates payment_intent (PENDING)                        │
│                                                                             │
│  Step 5: Payment Verification                                               │
│          ├── Android app captures SMS                                       │
│          ├── Server matches TrxID + Amount + Phone                          │
│          ├── if matched → Activate plan, notify user                        │
│          └── if not matched in 10 min → MANUAL_REVIEW                       │
│                                                                             │
│  Step 6: Plan Activated                                                     │
│          ├── ✅ New limits activated instantly                              │
│          ├── ✅ Previously archived data restored                           │
│          └── → Redirect to Dashboard                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 7. Complete Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DOKANIAI NAVIGATION FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

LOGIN
  │
  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 BUSINESS OVERVIEW (My Businesses)                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ 🏪 রহিম স্টোর    │  │ 🏪 করিম গ্রোসারী │  │ 🏪 আনিস কাপড়   │  [+ নতুন]   │
│  │ ─────────────── │  │ ─────────────── │  │ ─────────────── │             │
│  │ আজ: ৳১২,৪৫০    │  │ আজ: ৳৮,২০০     │  │ আজ: ৳৫,৬০০     │             │
│  │ বাকী: ৳৪২,৯০০  │  │ বাকী: ৳১৫,০০০  │  │ বাকী: ৳৮,৫০০   │             │
│  │ [প্রবেশ করুন →] │  │ [প্রবেশ করুন →] │  │ [প্রবেশ করুন →] │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  Sidebar: [📊 Overview] [⚙️ Settings] [👤 Profile] [💳 Subscription]        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                    Click on a business
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  🏪 রহিম স্টোর - WORKSPACE                    [← সব ব্যবসা] [Switch ▼]     │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Sidebar:                                                                   │
│  ┌─────────────────┐                                                        │
│  │ 📊 ড্যাশবোর্ড    │                                                        │
│  │ 🛒 বিক্রয়       │                                                        │
│  │ 💰 খরচ         │                                                        │
│  │ 📖 বাকী খাতা    │                                                        │
│  │ 📦 পণ্য         │                                                        │
│  │ 📈 রিপোর্ট      │                                                        │
│  │ ✨ AI সহকারী   │                                                        │
│  │ ─────────────── │                                                        │
│  │ [← সব ব্যবসা]   │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
│  Main Content: KPI Cards, Quick Actions, Transactions, Stock Alerts        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 8. Page Structure

## 8.1 Complete Page List

| Page | Route | Auth Required | Purpose |
|------|-------|---------------|---------|
| **Landing** | `/` | ❌ No | Hero, Features, Pricing cards |
| **Pricing** | `/pricing` | ❌ No | Detailed plan comparison |
| **Login** | `/login` | ❌ No | Email/Phone login |
| **Register** | `/register` | ❌ No | New user registration |
| **OTP Verify** | `/verify-otp` | ❌ No | OTP verification |
| **Business Overview** | `/businesses` | ✅ Yes | All businesses list |
| **Shop Dashboard** | `/shop/[businessId]` | ✅ Yes | Per-shop dashboard |
| **Shop Sales** | `/shop/[businessId]/sales` | ✅ Yes | Sales management |
| **Shop Expenses** | `/shop/[businessId]/expenses` | ✅ Yes | Expense tracking |
| **Shop Due** | `/shop/[businessId]/due` | ✅ Yes | Due ledger |
| **Shop Products** | `/shop/[businessId]/products` | ✅ Yes | Inventory |
| **Shop Reports** | `/shop/[businessId]/reports` | ✅ Yes | Analytics |
| **Shop AI** | `/shop/[businessId]/ai` | ✅ Yes | AI assistant |
| **Onboarding** | `/onboarding` | ✅ Yes | First-time setup |
| **Subscription** | `/subscription` | ✅ Yes | Current plan, history |
| **Upgrade** | `/subscription/upgrade` | ✅ Yes | Plan upgrade + payment |
| **Payment Status** | `/subscription/payment/[id]` | ✅ Yes | Payment verification |
| **Settings** | `/settings` | ✅ Yes | Account settings |
| **Profile** | `/profile` | ✅ Yes | Personal info |

## 8.2 Redirect Logic

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  REDIRECT LOGIC                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Legacy Route: /dashboard/*                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  → Redirect to: /shop/[activeBusinessId]/*                                  │
│  → Preserve query params                                                    │
│  → Valid for one release cycle                                              │
│                                                                             │
│  Post-Login Redirect:                                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│  if (pending_upgrade_plan) {                                                │
│      → /subscription/upgrade?plan=[planId]                                  │
│  } else if (user.businesses.length === 0) {                                 │
│      → /onboarding                                                          │
│  } else if (user.businesses.length === 1) {                                 │
│      → /shop/[businessId] (skip overview)                                   │
│  } else {                                                                   │
│      → /businesses (show overview)                                          │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 9. UI States for Pricing Cards

## 9.1 Card States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRICING CARD STATES                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STATE 1: Non-Authenticated User                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  বেসিক - ৳১৪৯/মাস                                                   │   │
│  │  ───────────────────────────────────────────────────────────────    │   │
│  │  • ১টি ব্যবসা                                                       │   │
│  │  • ১০০ পণ্য                                                         │   │
│  │  • ২৫ AI কুয়েরি/দিন                                                │   │
│  │                                                                     │   │
│  │  [শুরু করুন] ← Click → Show Register Modal                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  STATE 2: Authenticated User (Free Trial)                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  বেসিক - ৳১৪৯/মাস                                                   │   │
│  │  ───────────────────────────────────────────────────────────────    │   │
│  │  • ১টি ব্যবসা                                                       │   │
│  │  • ১০০ পণ্য                                                         │   │
│  │  • ২৫ AI কুয়েরি/দিন                                                │   │
│  │                                                                     │   │
│  │  [আপগ্রেড করুন] ← Click → Go to Payment Flow                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  STATE 3: Authenticated User (Current Plan)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  বেসিক - ৳১৪৯/মাস                                                   │   │
│  │  ───────────────────────────────────────────────────────────────    │   │
│  │  • ১টি ব্যবসা                                                       │   │
│  │  • ১০০ পণ্য                                                         │   │
│  │  • ২৫ AI কুয়েরি/দিন                                                │   │
│  │                                                                     │   │
│  │  [বর্তমান প্ল্যান] ✓ ← Disabled, green checkmark                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  STATE 4: Authenticated User (Higher Plan - Pro user on Basic card)        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  বেসিক - ৳১৪৯/মাস                                                   │   │
│  │  ───────────────────────────────────────────────────────────────    │   │
│  │  • ১টি ব্যবসা                                                       │   │
│  │  • ১০০ পণ্য                                                         │   │
│  │  • ২৫ AI কুয়েরি/দিন                                                │   │
│  │                                                                     │   │
│  │  [ডাউনগ্রেড করুন] ← Click → Downgrade confirmation                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 9.2 Button State Logic

```typescript
function getPricingCardState(plan: Plan, user: User | null): CardState {
  // Not logged in
  if (!user) {
    return {
      buttonType: plan.isFree ? "START_FREE" : "REGISTER_TO_BUY",
      buttonText: plan.isFree ? "শুরু করুন" : "কিনুন",
      disabled: false,
    };
  }

  // Logged in
  const currentPlan = user.subscription.plan;
  const planTier = getPlanTier(plan.id);
  const currentTier = getPlanTier(currentPlan.id);

  if (plan.id === currentPlan.id) {
    return {
      buttonType: "CURRENT",
      buttonText: "বর্তমান প্ল্যান",
      disabled: true,
    };
  }

  if (planTier > currentTier) {
    return {
      buttonType: "UPGRADE",
      buttonText: "আপগ্রেড করুন",
      disabled: false,
    };
  }

  if (planTier < currentTier) {
    return {
      buttonType: "DOWNGRADE",
      buttonText: "ডাউনগ্রেড করুন",
      disabled: false,
    };
  }

  return {
    buttonType: "SELECT",
    buttonText: "নির্বাচন করুন",
    disabled: false,
  };
}
```

---

# 10. Session Storage Strategy

## 10.1 Implementation

```typescript
// When user clicks on a paid plan (not logged in)
function handlePlanClick(planId: string, isLoggedIn: boolean) {
  if (!isLoggedIn) {
    // Store plan selection for post-login redirect
    sessionStorage.setItem('pending_upgrade_plan', planId);
    sessionStorage.setItem('redirect_after_login', `/subscription/upgrade?plan=${planId}`);
    
    // Show login/register modal
    showAuthModal();
  } else {
    // Go directly to payment flow
    router.push(`/subscription/upgrade?plan=${planId}`);
  }
}

// After login success
function handleLoginSuccess(user: User) {
  const pendingPlan = sessionStorage.getItem('pending_upgrade_plan');
  
  if (pendingPlan) {
    // Clear stored data
    sessionStorage.removeItem('pending_upgrade_plan');
    sessionStorage.removeItem('redirect_after_login');
    
    // Redirect to upgrade flow
    router.push(`/subscription/upgrade?plan=${pendingPlan}`);
  } else {
    // Normal flow
    if (user.businesses.length === 0) {
      router.push('/onboarding');
    } else if (user.businesses.length === 1) {
      router.push(`/shop/${user.businesses[0].id}`);
    } else {
      router.push('/businesses');
    }
  }
}
```

---

# 11. Mobile Considerations

## 11.1 Pricing Cards on Mobile

```
┌─────────────────────────────────────────────┐
│  📱 Mobile Pricing View                      │
│  ─────────────────────────────────────────  │
│                                             │
│  Option A: Horizontal Scroll Cards          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ ফ্রি    │ │ বেসিক  │ │ প্রো   │ →     │
│  │ ৳০     │ │ ৳১৪৯   │ │ ৳৩৯৯  │       │
│  └─────────┘ └─────────┘ └─────────┘       │
│                                             │
│  Option B: Accordion Style                  │
│  ▼ প্রো - ৳৩৯৯/মাস ⭐                       │
│    • ৩টি ব্যবসা                            │
│    • ২০০ পণ্য                              │
│    • ৭৫ AI কুয়েরি/দিন                     │
│    [কিনুন]                                 │
│                                             │
└─────────────────────────────────────────────┘
```

## 11.2 Business Switcher on Mobile

```
┌─────────────────────────────────────────────┐
│  [☰] রহিম স্টোর ▼           [🔔] [👤]       │
├─────────────────────────────────────────────┤
│                                             │
│              Main Content                   │
│                                             │
├─────────────────────────────────────────────┤
│  [🏠]  [📖]  [🎤 AI]  [📦]  [👤]           │
│  হোম   বাকী  সহকারী   পণ্য   প্রোফাইল     │
└─────────────────────────────────────────────┘

[☰] = Hamburger menu → Sidebar with all navigation
রহিম স্টোর ▼ = Business switcher dropdown
```

---

# 12. Cost Analysis

## 12.1 LLM Provider Chain

| Priority | Provider | Model | Cost | Trigger |
|----------|----------|-------|------|---------|
| 1 | Zhipu AI (Z.ai) | GLM-4.7-Flash | **FREE** | All requests (Primary) |
| 2 | Google | Gemini 2.5 Flash-Lite | FREE tier | GLM-4.7 error/timeout |
| 3 | Ollama | Llama 3.2 3B | FREE (VPS RAM) | Both cloud APIs down |

## 12.2 Cost Per 100 Users Per Month (If Paid)

| Plan | Users | Queries/Day | Queries/Month | Cost/Month |
|------|-------|-------------|---------------|------------|
| Free | 70 | 5 | 10,500 | $2.04 |
| Basic | 20 | 25 | 15,000 | $3.10 |
| Pro | 8 | 75 | 18,000 | $3.71 |
| Plus | 2 | 200 | 12,000 | $2.46 |
| **Total** | **100** | - | **55,500** | **$11.31** |

## 12.3 Actual Cost with GLM-4.7-Flash

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ACTUAL COST WITH GLM-4.7-FLASH (PRIMARY)                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  💰 Input:  FREE                                                            │
│  💰 Output: FREE                                                            │
│  💰 Total:  ৳0                                                              │
│                                                                             │
│  Only fallback to Gemini (paid) when:                                       │
│  • GLM-4.7 is down (~1% of time)                                            │
│  • Rate limit exceeded (60 RPM)                                             │
│                                                                             │
│  Estimated fallback usage: ~5% of queries                                   │
│  Real monthly cost: $11.31 × 5% = $0.57 (≈ ৳63)                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 13. Design Guidelines

## 13.1 Card Design Tips

| Plan | Card Style | Badge | Highlight |
|------|------------|-------|-----------|
| ফ্রি ট্রায়াল ১ | Default | - | No |
| ফ্রি ট্রায়াল ২ | Default | "FT1 শেষে অফার" | No |
| বেসিক | Default | - | No |
| **প্রো** | Elevated + Border | "জনপ্রিয়" ⭐ | **Yes** (recommended) |
| প্লাস | Default | - | No |
| এন্টারপ্রাইজ | Premium/Dark | "যোগাযোগ করুন" | No |

## 13.2 Color Scheme

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PRICING CARD COLORS                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Free Trial:    bg-surface, border-default                                  │
│  Basic:         bg-surface, border-default                                  │
│  Pro:           bg-primary/5, border-primary, shadow-lg  ← Highlighted      │
│  Plus:          bg-surface, border-default                                  │
│  Enterprise:    bg-slate-900, text-white, premium look                      │
│                                                                             │
│  Button Colors:                                                              │
│  • Primary CTA:   bg-primary, text-white                                    │
│  • Secondary CTA: bg-secondary, text-white                                  │
│  • Current Plan:  bg-green-100, text-green-700, disabled                    │
│  • Downgrade:     bg-slate-100, text-slate-600                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# Summary

## Quick Reference

| Aspect | Value |
|--------|-------|
| **Plans** | 6 (FT1, FT2, Basic, Pro, Plus, Enterprise) |
| **FT1** | Auto-assigned on registration (65 days) |
| **FT2** | Offered after FT1 expires (35 days) |
| **Voice Input** | FREE (local BanglaSpeech2Text) |
| **AI Queries** | 5/25/75/300 per plan |
| **Character Limits** | 150/200/350/600 per plan |
| **LLM Cost** | ৳0 (GLM-4.7-Flash is FREE) |
| **Payment Methods** | bKash, Nagad, Rocket |
| **Architecture** | Two-level (Business Overview → Shop Workspace) |

---

*Document generated for DokaniAI Project*
*Version 1.0 | April 2025*
