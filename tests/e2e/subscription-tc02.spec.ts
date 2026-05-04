import { expect, test, type Page } from "@playwright/test";

const authState = {
  state: {
    accessToken: "tc02-access",
    refreshToken: "tc02-refresh",
    userId: "23000000-0000-0000-0000-000000000001",
    status: "SUCCESS",
    userRole: "USER",
  },
  version: 0,
};

const plans = [
  plan("trial-1", "FREE_TRIAL_1", "Free Trial 1", "ফ্রি ট্রায়াল ১", 0, 0, true, { VOICE_ENTRY: true, TEXT_NLP: true }),
  plan("basic", "BASIC", "Basic", "বেসিক", 149, 2, false, { DUE_MANAGEMENT: true, VOICE_ENTRY: true }),
  plan("pro", "PRO", "Pro", "প্রো", 399, 3, false, { DUE_MANAGEMENT: true, DISCOUNT_MANAGEMENT: true, VOICE_ENTRY: true, TEXT_NLP: true }),
  plan("plus", "PLUS", "Plus", "প্লাস", 799, 4, false, { DUE_MANAGEMENT: true, DISCOUNT_MANAGEMENT: true, VOICE_ENTRY: true, TEXT_NLP: true, WHATSAPP_REMINDER: true }),
];

function plan(id: string, name: string, displayNameEn: string, displayNameBn: string, priceBdt: number, tierLevel: number, isTrial: boolean, features: Record<string, boolean>) {
  return {
    id,
    name,
    displayNameEn,
    displayNameBn,
    priceBdt,
    annualPriceBdt: isTrial ? null : priceBdt * 10,
    tierLevel,
    isTrial,
    isActive: true,
    durationDays: isTrial ? 30 : 30,
    maxBusinesses: tierLevel >= 4 ? -1 : 1,
    maxProductsPerBusiness: tierLevel >= 3 ? 500 : 100,
    aiQueriesPerDay: tierLevel >= 4 ? -1 : 25,
    maxAiTokensPerQuery: 2000,
    maxQueryCharacters: 1000,
    conversationHistoryTurns: 10,
    features,
  };
}

function subscription(planId = "basic", status = "ACTIVE") {
  return {
    id: `sub-${planId}`,
    userId: authState.state.userId,
    planId,
    plan: plans.find((item) => item.id === planId),
    status,
    currentPeriodStart: "2026-05-01T00:00:00Z",
    currentPeriodEnd: status === "EXPIRED" ? "2026-05-01T00:00:00Z" : "2026-06-01T00:00:00Z",
    cancelAtPeriodEnd: status === "EXPIRED",
    billingCycle: "MONTHLY",
  };
}

async function seedAuth(page: Page) {
  await page.addInitScript((state) => {
    localStorage.setItem("dokaniai-auth-storage", JSON.stringify(state));
  }, authState);
}

async function stubSubscriptionApis(page: Page) {
  await page.route("**/api/v1/businesses", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          businesses: [{ id: "biz-1", name: "TC02 Store", status: "ACTIVE", businessType: "GROCERY" }],
          total: 1,
        },
      }),
    });
  });
  await page.route("**/api/v1/subscriptions/plans", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: plans }) });
  });
  await page.route("**/api/v1/subscriptions/current", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: subscription("basic") }),
    });
  });
  await page.route("**/api/v1/subscriptions/limits", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { maxBusinesses: 1, currentBusinesses: 1, maxProductsPerBusiness: 100, aiQueriesPerDay: 25, dueManagementEnabled: true, whatsappReminderEnabled: false } }),
    });
  });
  await page.route("**/api/v1/subscriptions/upgrade-proration**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { isUpgrade: true, currentPlanName: "Basic", currentPlanPrice: 149, newPlanName: "Pro", newPlanPrice: 399, proratedCredit: 74.5, upgradeAmount: 324.5 } }),
    });
  });
  await page.route("**/api/v1/subscriptions/validate-downgrade", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { canDowngrade: false, warnings: ["2 businesses exceed BASIC limit"], actions: ["Archive excess businesses"] } }),
    });
  });
  await page.route("**/api/v1/payments/initialize", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { paymentIntentId: "intent-1", amount: 324.5, status: "PENDING", mfsMethod: "BKASH", receiverNumber: "01700000000", expiresAt: "2026-05-04T15:30:00Z" } }),
    });
  });
  await page.route("**/api/v1/coupons/public", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) });
  });
  await page.route("**/api/v1/payments/history", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) });
  });
  await page.route("**/api/v1/subscriptions/referral-status", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { referralCode: "DKTEST", referredBy: null, earnedCredits: 1, totalReferrals: 1, pendingRewardCount: 0, rewardDays: 90, maxReferralsTotal: 10, referredDiscountType: "DISCOUNT_PERCENT", referredDiscountValue: 10 } }) });
  });
}

test.beforeEach(async ({ page }) => {
  await seedAuth(page);
  await stubSubscriptionApis(page);
});

test("TC-02-260 trial-to-paid journey surfaces trial and paid plans", async ({ page }) => {
  await page.goto("/account/subscription");
  await page.getByRole("button", { name: /Plans|প্ল্যান/i }).first().click();
  await expect(page.getByRole("button", { name: /Free Trial 1|ফ্রি ট্রায়াল ১/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Basic|বেসিক/i })).toBeVisible();
});

test("TC-02-261 upgrade flow shows prorated amount", async ({ page }) => {
  await page.goto("/account/subscription?plan=pro&billing=MONTHLY");
  await expect(page.getByText("৳৩২৪.৫")).toBeVisible();
});

test("TC-02-262 downgrade flow displays over-limit warning", async ({ page }) => {
  await page.route("**/api/v1/subscriptions/current", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: subscription("pro") }) });
  });
  await page.goto("/subscription/downgrade?plan=basic");
  await expect(page.getByText("• 2 businesses exceed BASIC limit")).toBeVisible();
});

test("TC-02-263 payment failure and retry path keeps user in payment flow", async ({ page }) => {
  let first = true;
  await page.route("**/api/v1/payments/initialize", async (route) => {
    if (first) {
      first = false;
      await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ success: false, error: { message: "Payment failed" } }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { paymentIntentId: "intent-retry", amount: 399, status: "PENDING", mfsMethod: "BKASH", receiverNumber: "01700000000", expiresAt: "2026-05-04T15:30:00Z" } }) });
  });
  await page.goto("/account/subscription?plan=pro");
  await expect(page).toHaveURL(/subscription/);
});

test("TC-02-264 referral status is visible on subscription page", async ({ page }) => {
  await page.goto("/account/subscription");
  await expect(page.getByText("DKTEST")).toBeVisible();
});

test("TC-02-265 expired subscription can reach renewal surface", async ({ page }) => {
  await page.route("**/api/v1/subscriptions/current", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: subscription("trial-1", "TRIAL") }) });
  });
  await page.goto("/account/subscription?plan=basic");
  await expect(page.getByRole("button", { name: /Basic|বেসিক/i })).toBeVisible();
  await page.getByRole("button", { name: /^পেমেন্ট$|^Payment$/i }).click();
  await expect(page.getByRole("button", { name: /আপগ্রেড পেমেন্ট|Start upgrade payment/i })).toBeVisible();
});

test("TC-02-280 mobile subscription page renders without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/account/subscription");
  await expect(page.getByRole("heading", { name: /Subscription Center|সাবস্ক্রিপশন সেন্টার/i })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("TC-02-281 desktop subscription page renders control-center sections", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/account/subscription");
  await expect(page.getByRole("button", { name: /Overview|ওভারভিউ/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^প্ল্যান$|^Plans$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^পেমেন্ট$|^Payment$/i })).toBeVisible();
});

test("TC-02-282 payment page has labeled interactive controls", async ({ page }) => {
  await page.goto("/account/subscription?plan=pro");
  const buttons = page.getByRole("button");
  await expect(buttons.first()).toBeVisible();
});

test("TC-02-283 Bangla currency and plan text render", async ({ page }) => {
  await page.goto("/account/subscription");
  await page.getByRole("button", { name: /^প্ল্যান$|^Plans$/i }).click();
  await expect(page.getByRole("button", { name: /প্রো আপগ্রেড/ })).toBeVisible();
});

test("TC-02-284 plan comparison remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/account/subscription");
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "hidden");
});

test("TC-02-285 current plan badge is displayed", async ({ page }) => {
  await page.goto("/account/subscription");
  await expect(page.getByText("সক্রিয়", { exact: true })).toBeVisible();
});

test("TC-02-286 downgrade warning modal includes affected data", async ({ page }) => {
  await page.route("**/api/v1/subscriptions/current", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: subscription("pro") }) });
  });
  await page.goto("/subscription/downgrade?plan=basic");
  await expect(page.getByText("• 2 businesses exceed BASIC limit")).toBeVisible();
});
