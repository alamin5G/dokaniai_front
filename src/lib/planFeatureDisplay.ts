import type { Plan, PlanFeatureConfig } from "@/types/subscription";

export interface DisplayFeatureItem {
  key: string;
  label: string;
  value: string | null;
  type: PlanFeatureConfig["type"];
  category: string | null;
}

export interface FeatureMatrixRow {
  key: string;
  label: string;
  category: string | null;
  type: PlanFeatureConfig["type"];
}

export interface FeatureMatrixSection {
  key: "core" | "premium" | "ai" | "limits" | "other";
  title: string;
  rows: FeatureMatrixRow[];
}

export const PROJECT_FEATURE_HIGHLIGHTS = [
  {
    key: "voice_entry",
    icon: "record_voice_over",
    titleEn: "Voice Command",
    titleBn: "ভয়েস কমান্ড",
    descriptionEn: "Speak naturally and create sales, expenses, due entries, and product updates faster.",
    descriptionBn: "মুখে বলেই বিক্রি, খরচ, বাকি ও পণ্য আপডেট দ্রুত করুন।",
    tags: ["Voice", "NLP"],
  },
  {
    key: "due_management",
    icon: "account_balance_wallet",
    titleEn: "Due Ledger",
    titleBn: "বাকি খাতা",
    descriptionEn: "Track customer credit, collections, and reminders from one controlled workflow.",
    descriptionBn: "ক্রেতার বাকি, জমা ও রিমাইন্ডার এক জায়গা থেকে ম্যানেজ করুন।",
    tags: ["Due", "Reminder"],
  },
  {
    key: "products_sales",
    icon: "inventory_2",
    titleEn: "Products & Sales",
    titleBn: "পণ্য ও বিক্রি",
    descriptionEn: "Run inventory, stock alerts, product analytics, and fast checkout together.",
    descriptionBn: "ইনভেন্টরি, স্টক অ্যালার্ট, পণ্য অ্যানালিটিক্স ও দ্রুত বিক্রি একসাথে চালান।",
    tags: ["Inventory", "Sales"],
  },
  {
    key: "basic_reports",
    icon: "monitoring",
    titleEn: "Business Reports",
    titleBn: "বিজনেস রিপোর্ট",
    descriptionEn: "Use sales, stock, customer, return, and AI-assisted reports for decisions.",
    descriptionBn: "বিক্রি, স্টক, কাস্টমার, রিটার্ন ও AI রিপোর্ট দিয়ে সিদ্ধান্ত নিন।",
    tags: ["Reports", "MIS"],
  },
] as const;

const FEATURE_LABELS_EN: Record<string, string> = {
  max_businesses: "Businesses",
  max_products_per_business: "Products per business",
  ai_queries_per_day: "AI queries",
  max_ai_tokens_per_query: "AI tokens per query",
  max_query_characters: "Query characters",
  conversation_history_turns: "Conversation history",
  products_sales: "Products & Sales",
  expense_tracking: "Expense Tracking",
  basic_reports: "Basic Reports",
  due_management: "Due Ledger",
  discount_management: "Discount",
  voice_entry: "Voice Input",
  text_nlp: "Text NLP",
  whatsapp_reminder: "WhatsApp Reminder",
  smart_notifications: "Smart AI Notifications",
  support_ticket: "Support Ticket",
  advanced_reports: "Advanced Reports",
  pdf_export: "PDF Export",
  bulk_import: "Bulk Import",
  priority_support: "Priority Support",
  data_export: "Data Export",
  api_access: "API Access",
};

const FEATURE_LABELS_BN: Record<string, string> = {
  max_businesses: "ব্যবসা",
  max_products_per_business: "প্রতি ব্যবসায় পণ্য",
  ai_queries_per_day: "AI কুয়েরি",
  max_ai_tokens_per_query: "AI টোকেন/কুয়েরি",
  max_query_characters: "কুয়েরি অক্ষর",
  conversation_history_turns: "কনভারসেশন হিস্টোরি",
  products_sales: "পণ্য ও বিক্রয়",
  expense_tracking: "খরচ ট্র্যাকিং",
  basic_reports: "বেসিক রিপোর্ট",
  due_management: "বাকী খাতা",
  discount_management: "ডিসকাউন্ট",
  voice_entry: "ভয়েস ইনপুট",
  text_nlp: "টেক্সট NLP",
  whatsapp_reminder: "WhatsApp রিমাইন্ডার",
  smart_notifications: "স্মার্ট AI নোটিফিকেশন",
  support_ticket: "সাপোর্ট টিকেট",
  advanced_reports: "অ্যাডভান্সড রিপোর্ট",
  pdf_export: "PDF এক্সপোর্ট",
  bulk_import: "বাল্ক ইম্পোর্ট",
  priority_support: "প্রায়োরিটি সাপোর্ট",
  data_export: "ডেটা এক্সপোর্ট",
  api_access: "API অ্যাক্সেস",
};

const CORE_FEATURE_KEYS = [
  "products_sales",
  "expense_tracking",
  "basic_reports",
  "due_management",
  "discount_management",
  "voice_entry",
  "text_nlp",
  "whatsapp_reminder",
  "smart_notifications",
  "support_ticket",
];

const PREMIUM_FEATURE_KEYS = [
  "advanced_reports",
  "pdf_export",
  "bulk_import",
  "priority_support",
  "data_export",
  "api_access",
];

const AI_LIMIT_KEYS = [
  "ai_queries_per_day",
  "max_ai_tokens_per_query",
  "max_query_characters",
  "conversation_history_turns",
];

const LIMIT_KEYS = [
  "max_businesses",
  "max_products_per_business",
];

function fallbackLabel(key: string, isBn: boolean) {
  const map = isBn ? FEATURE_LABELS_BN : FEATURE_LABELS_EN;
  return map[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNumber(value: number, isBn: boolean) {
  return new Intl.NumberFormat(isBn ? "bn-BD" : "en-US").format(value);
}

function formatLimitValue(value: number | null, isBn: boolean) {
  if (value == null || value < 0) return isBn ? "আনলিমিটেড" : "Unlimited";
  if (value === 0) return isBn ? "আনলিমিটেড" : "Unlimited";
  return formatNumber(value, isBn);
}

function resetSuffix(resetPeriod: PlanFeatureConfig["resetPeriod"], isBn: boolean) {
  if (!resetPeriod || resetPeriod === "NEVER") return "";
  const labels: Record<string, string> = isBn
    ? { DAILY: "/দিন", WEEKLY: "/সপ্তাহ", MONTHLY: "/মাস" }
    : { DAILY: "/day", WEEKLY: "/week", MONTHLY: "/month" };
  return labels[resetPeriod] ?? "";
}

function isVisibleFeature(feature: PlanFeatureConfig) {
  return feature.enabled && feature.activeFeature !== false && feature.publicFeature !== false;
}

function compareFeature(a: PlanFeatureConfig, b: PlanFeatureConfig) {
  return (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.featureKey.localeCompare(b.featureKey);
}

export function getPlanFeatureItems(plan: Plan, isBn: boolean, maxItems?: number): DisplayFeatureItem[] {
  const dynamicItems = (plan.featureConfigs ?? [])
    .filter(isVisibleFeature)
    .sort(compareFeature)
    .map((feature) => {
      const label = (isBn ? feature.nameBn : feature.nameEn) || fallbackLabel(feature.featureKey, isBn);
      const value = feature.type === "BOOLEAN"
        ? null
        : `${formatLimitValue(feature.limitValue, isBn)}${resetSuffix(feature.resetPeriod, isBn)}`;
      return {
        key: feature.featureKey,
        label,
        value,
        type: feature.type,
        category: feature.category,
      };
    });

  const items = dynamicItems.length > 0 ? dynamicItems : getLegacyFeatureItems(plan, isBn);
  return maxItems == null ? items : items.slice(0, maxItems);
}

export function getFeatureMatrixRows(plans: Plan[], isBn: boolean): FeatureMatrixRow[] {
  const rows = new Map<string, FeatureMatrixRow & { order: number }>();
  for (const plan of plans) {
    for (const feature of plan.featureConfigs ?? []) {
      if (feature.activeFeature === false || feature.publicFeature === false) continue;
      const label = (isBn ? feature.nameBn : feature.nameEn) || fallbackLabel(feature.featureKey, isBn);
      rows.set(feature.featureKey, {
        key: feature.featureKey,
        label,
        category: feature.category,
        type: feature.type,
        order: feature.displayOrder ?? 0,
      });
    }
  }

  if (rows.size === 0) {
    for (const item of getLegacyFeatureRows(isBn)) rows.set(item.key, { ...item, order: 0 });
  }

  return Array.from(rows.values())
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    .map((row) => ({
      key: row.key,
      label: row.label,
      category: row.category,
      type: row.type,
    }));
}

export function getFeatureMatrixSections(plans: Plan[], isBn: boolean): FeatureMatrixSection[] {
  const rows = getFeatureMatrixRows(plans, isBn);
  const consumed = new Set<string>();

  function take(keys: string[], titleBn: string, titleEn: string, sectionKey: FeatureMatrixSection["key"]) {
    const sectionRows = keys
      .map((key) => rows.find((row) => row.key === key))
      .filter((row): row is FeatureMatrixRow => Boolean(row));
    sectionRows.forEach((row) => consumed.add(row.key));
    return {
      key: sectionKey,
      title: isBn ? titleBn : titleEn,
      rows: sectionRows,
    };
  }

  const sections: FeatureMatrixSection[] = [
    take(CORE_FEATURE_KEYS, "সকল প্ল্যানে পাওয়া যায়", "Available on All Plans", "core"),
    take(PREMIUM_FEATURE_KEYS, "প্রিমিয়াম ফিচার", "Premium Features", "premium"),
    take(AI_LIMIT_KEYS, "AI কুয়েরি ও AI সীমা", "AI Queries and Limits", "ai"),
    take(LIMIT_KEYS, "অন্যান্য সীমা", "Other Limits", "limits"),
  ];

  const remaining = rows.filter((row) => !consumed.has(row.key));
  if (remaining.length > 0) {
    sections.push({
      key: "other",
      title: isBn ? "অন্যান্য ফিচার" : "Other Features",
      rows: remaining,
    });
  }

  return sections.filter((section) => section.rows.length > 0);
}

export function getPlanFeatureCell(plan: Plan, featureKey: string, isBn: boolean) {
  const dynamic = plan.featureConfigs?.find((feature) => feature.featureKey === featureKey);
  if (dynamic) {
    if (!isVisibleFeature(dynamic)) return isBn ? "না" : "No";
    if (dynamic.type === "BOOLEAN") return isBn ? "হ্যাঁ" : "Yes";
    return `${formatLimitValue(dynamic.limitValue, isBn)}${resetSuffix(dynamic.resetPeriod, isBn)}`;
  }

  if (plan.features?.[featureKey] === true) return isBn ? "হ্যাঁ" : "Yes";
  return isBn ? "না" : "No";
}

function getLegacyFeatureItems(plan: Plan, isBn: boolean): DisplayFeatureItem[] {
  const items: DisplayFeatureItem[] = [
    {
      key: "max_businesses",
      label: fallbackLabel("max_businesses", isBn),
      value: formatLimitValue(plan.maxBusinesses, isBn),
      type: "LIMIT",
      category: "CORE",
    },
  ];

  if (plan.maxProductsPerBusiness != null) {
    items.push({
      key: "max_products_per_business",
      label: fallbackLabel("max_products_per_business", isBn),
      value: formatLimitValue(plan.maxProductsPerBusiness, isBn),
      type: "LIMIT",
      category: "CORE",
    });
  }

  if (plan.aiQueriesPerDay != null) {
    items.push({
      key: "ai_queries_per_day",
      label: fallbackLabel("ai_queries_per_day", isBn),
      value: `${formatLimitValue(plan.aiQueriesPerDay, isBn)}${isBn ? "/দিন" : "/day"}`,
      type: "QUOTA",
      category: "AI",
    });
  }

  Object.entries(plan.features ?? {})
    .filter(([, enabled]) => enabled)
    .forEach(([key]) => {
      items.push({
        key,
        label: fallbackLabel(key, isBn),
        value: null,
        type: "BOOLEAN",
        category: null,
      });
    });

  return items;
}

function getLegacyFeatureRows(isBn: boolean): FeatureMatrixRow[] {
  return [
    "products_sales",
    "expense_tracking",
    "basic_reports",
    "due_management",
    "discount_management",
    "voice_entry",
    "text_nlp",
    "whatsapp_reminder",
    "advanced_reports",
    "pdf_export",
    "bulk_import",
    "priority_support",
    "data_export",
    "api_access",
    "ai_queries_per_day",
    "max_businesses",
    "max_products_per_business",
  ].map((key) => ({
    key,
    label: fallbackLabel(key, isBn),
    category: key.startsWith("ai_") ? "AI" : null,
    type: LIMIT_KEYS.includes(key) ? "LIMIT" : key.startsWith("ai_") ? "QUOTA" : "BOOLEAN",
  }));
}
