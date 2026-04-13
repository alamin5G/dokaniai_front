import { expect, test } from "@playwright/test";

const PLANS_FIXTURE = [
  {
    id: "plan-ft1",
    name: "FREE_TRIAL_1",
    tierLevel: 1,
    displayNameBn: "ফ্রি ট্রায়াল ১",
    displayNameEn: "Free Trial 1",
    priceBdt: 0,
    annualPriceBdt: null,
    durationDays: 30,
    maxBusinesses: 1,
    maxProductsPerBusiness: null,
    aiQueriesPerDay: 5,
    maxAiTokensPerQuery: 1000,
    conversationHistoryTurns: 3,
    maxQueryCharacters: 150,
    features: { voice_entry: true, due_management: true, discount_management: true, text_nlp: true },
    isTrial: true,
    isActive: true,
  },
  {
    id: "plan-basic",
    name: "BASIC",
    tierLevel: 2,
    displayNameBn: "বেসিক",
    displayNameEn: "Basic",
    priceBdt: 149,
    annualPriceBdt: null,
    durationDays: 30,
    maxBusinesses: 1,
    maxProductsPerBusiness: 100,
    aiQueriesPerDay: 25,
    maxAiTokensPerQuery: 2000,
    conversationHistoryTurns: 10,
    maxQueryCharacters: 200,
    features: { voice_entry: true, due_management: true, discount_management: true, text_nlp: true },
    isTrial: false,
    isActive: true,
  },
  {
    id: "plan-pro",
    name: "PRO",
    tierLevel: 3,
    displayNameBn: "প্রো",
    displayNameEn: "Pro",
    priceBdt: 399,
    annualPriceBdt: null,
    durationDays: 30,
    maxBusinesses: 3,
    maxProductsPerBusiness: 200,
    aiQueriesPerDay: 75,
    maxAiTokensPerQuery: 4000,
    conversationHistoryTurns: 20,
    maxQueryCharacters: 350,
    features: { bulk_import: true },
    isTrial: false,
    isActive: true,
  },
  {
    id: "plan-plus",
    name: "PLUS",
    tierLevel: 4,
    displayNameBn: "প্লাস",
    displayNameEn: "Plus",
    priceBdt: 799,
    annualPriceBdt: null,
    durationDays: 30,
    maxBusinesses: 7,
    maxProductsPerBusiness: null,
    aiQueriesPerDay: 300,
    maxAiTokensPerQuery: 8000,
    conversationHistoryTurns: 50,
    maxQueryCharacters: 600,
    features: { priority_support: true, data_export: true },
    isTrial: false,
    isActive: true,
  },
  {
    id: "plan-enterprise",
    name: "ENTERPRISE",
    tierLevel: 5,
    displayNameBn: "এন্টারপ্রাইজ",
    displayNameEn: "Enterprise",
    priceBdt: 0,
    annualPriceBdt: null,
    durationDays: 365,
    maxBusinesses: 0,
    maxProductsPerBusiness: null,
    aiQueriesPerDay: null,
    maxAiTokensPerQuery: 16000,
    conversationHistoryTurns: -1,
    maxQueryCharacters: 2000,
    features: { api_access: true },
    isTrial: false,
    isActive: true,
  },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("dokaniai-language", JSON.stringify({ state: { locale: "en" }, version: 0 }));
  });

  await page.route("**/subscriptions/plans**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: PLANS_FIXTURE }),
    });
  });
});

test("unauthenticated pricing click stores pending upgrade and redirects to login", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByTestId("plan-action-pro").click();

  await expect(page).toHaveURL(/\/login$/);
  await expect.poll(async () => page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"))).toBe("plan-pro");
  await expect.poll(async () => page.evaluate(() => sessionStorage.getItem("redirect_after_login"))).toBe(
    "/subscription/upgrade?plan=plan-pro",
  );
});

test("authenticated user sees current plan and upgrade actions", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "dokaniai-auth-storage",
      JSON.stringify({ state: { accessToken: "token", refreshToken: "refresh", userId: "user-1" }, version: 0 }),
    );
  });

  await page.route("**/subscriptions/current**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: "sub-1",
          userId: "user-1",
          planId: "plan-basic",
          status: "ACTIVE",
          currentPeriodStart: "2026-04-01T00:00:00.000Z",
          currentPeriodEnd: "2026-05-01T00:00:00.000Z",
          cancelAtPeriodEnd: false,
        },
      }),
    });
  });

  await page.goto("/pricing");

  await expect(page.getByTestId("plan-action-basic")).toBeDisabled();
  await expect(page.getByTestId("plan-action-pro")).toBeEnabled();
  await expect(page.getByTestId("plan-action-plus")).toBeEnabled();
});

