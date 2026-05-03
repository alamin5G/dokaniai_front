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
};

const FEATURE_LABELS_BN: Record<string, string> = {
  max_businesses: "ব্যবসা",
  max_products_per_business: "প্রতি ব্যবসায় পণ্য",
  ai_queries_per_day: "AI কুয়েরি",
  max_ai_tokens_per_query: "AI টোকেন/কুয়েরি",
  max_query_characters: "কুয়েরি অক্ষর",
  conversation_history_turns: "কনভারসেশন হিস্টোরি",
};

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
  const rows = new Map<string, FeatureMatrixRow>();
  for (const plan of plans) {
    for (const feature of plan.featureConfigs ?? []) {
      if (feature.activeFeature === false || feature.publicFeature === false) continue;
      const label = (isBn ? feature.nameBn : feature.nameEn) || fallbackLabel(feature.featureKey, isBn);
      rows.set(feature.featureKey, { key: feature.featureKey, label });
    }
  }

  if (rows.size === 0) {
    for (const item of getLegacyFeatureRows(isBn)) rows.set(item.key, item);
  }

  return Array.from(rows.values()).sort((a, b) => a.label.localeCompare(b.label));
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
  ].map((key) => ({ key, label: fallbackLabel(key, isBn) }));
}
