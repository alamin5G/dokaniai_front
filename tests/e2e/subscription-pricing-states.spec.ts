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

test("unauthenticated pricing click stores pending upgrade and redirects to register", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByTestId("quick-reference-table")).toBeVisible();
  await expect(page.getByTestId("feature-matrix-table")).toBeVisible();
  await expect(page.getByTestId("plan-card-plan-enterprise")).toContainText("Custom");
  await expect(page.getByTestId("plan-action-plan-basic")).toContainText("Buy Now");
  await page.getByTestId("plan-action-plan-pro").click();

  // Updated: pricing CTA now redirects to /register (not /login) for unauthenticated users
  await expect(page).toHaveURL(/\/register$/);
  await expect.poll(async () => page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"))).toBe("plan-pro");
  await expect.poll(async () => page.evaluate(() => sessionStorage.getItem("pending_plan_is_trial"))).toBe("false");
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

  await page.route("**/subscriptions/validate-downgrade", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          canDowngrade: true,
          businessLimitOk: 1,
          productLimitOk: 1,
          warnings: [],
          actions: [],
        },
      }),
    });
  });

  await page.goto("/pricing");

  await expect(page.getByTestId("quick-reference-table")).toBeVisible();
  await expect(page.getByTestId("feature-matrix-table")).toBeVisible();
  await expect(page.getByTestId("plan-action-plan-basic")).toBeDisabled();
  await expect(page.getByTestId("plan-action-plan-pro")).toBeEnabled();
  await expect(page.getByTestId("plan-action-plan-plus")).toBeEnabled();

  await page.getByTestId("plan-action-plan-ft1").click();
  await expect(page).toHaveURL(/\/subscription\/downgrade\?plan=plan-ft1/);
});

test("registered phone user with pending upgrade is redirected to upgrade after OTP + login", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    sessionStorage.setItem("pending_upgrade_plan", "plan-pro");
    sessionStorage.setItem("pending_plan_is_trial", "false");
    sessionStorage.setItem("redirect_after_login", "/subscription/upgrade?plan=plan-pro");
    sessionStorage.setItem("dokaniai-auth-contact", "01700000000");
    sessionStorage.setItem("dokaniai-auth-method", "phone");
  });

  await page.route("**/auth/verify/phone", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          userId: "user-1",
          status: "PASSWORD_SETUP_REQUIRED",
        },
      }),
    });
  });

  await page.route("**/auth/set-password", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: {} }),
    });
  });

  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          accessToken: "access-token-final",
          refreshToken: "refresh-token-final",
          userId: "user-1",
          status: "AUTHENTICATED",
        },
      }),
    });
  });

  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { id: "user-1", role: "USER" } }),
    });
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
          planId: "plan-ft1",
          status: "ACTIVE",
          currentPeriodStart: "2026-04-01T00:00:00.000Z",
          currentPeriodEnd: "2026-05-01T00:00:00.000Z",
          cancelAtPeriodEnd: false,
        },
      }),
    });
  });

  await page.goto("/verify-otp");
  await page.locator("form input").first().fill("123456");
  await page.locator("form button[type='submit']").click();

  await expect(page).toHaveURL(/\/set-password$/);
  await page.locator("form input").nth(0).fill("Passw0rd!");
  await page.locator("form input").nth(1).fill("Passw0rd!");
  await page.locator("form button[type='submit']").click();

  await expect(page).toHaveURL(/\/login\?passwordSet=true$/);
  await page.locator("form input").nth(0).fill("demo@example.com");
  await page.locator("form input").nth(1).fill("Passw0rd!");
  await page.locator("form button[type='submit']").click();

  await expect(page).toHaveURL(/\/subscription\/upgrade\?plan=plan-pro/);
});

test("phone OTP authenticated path redirects to login (upgrade happens after login)", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    sessionStorage.setItem("pending_upgrade_plan", "plan-pro");
    sessionStorage.setItem("pending_plan_is_trial", "false");
    sessionStorage.setItem("redirect_after_login", "/subscription/upgrade?plan=plan-pro");
    sessionStorage.setItem("dokaniai-auth-contact", "01700000000");
    sessionStorage.setItem("dokaniai-auth-method", "phone");
  });

  await page.route("**/auth/verify/phone", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          accessToken: "access-token-otp",
          refreshToken: "refresh-token-otp",
          userId: "user-otp",
          status: "AUTHENTICATED",
        },
      }),
    });
  });

  await page.route("**/subscriptions/current**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: "sub-otp",
          userId: "user-otp",
          planId: "plan-ft1",
          status: "ACTIVE",
          currentPeriodStart: "2026-04-01T00:00:00.000Z",
          currentPeriodEnd: "2026-05-01T00:00:00.000Z",
          cancelAtPeriodEnd: false,
        },
      }),
    });
  });

  // Updated: AUTHENTICATED status now redirects to /login (not upgrade page directly)
  // The upgrade redirect happens after the user logs in
  await page.goto("/verify-otp");
  await page.locator("form input").first().fill("123456");
  await page.locator("form button[type='submit']").click();

  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
});

test("verified email user resumes pending upgrade after login", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    sessionStorage.setItem("pending_upgrade_plan", "plan-plus");
    sessionStorage.setItem("redirect_after_login", "/subscription/upgrade?plan=plan-plus");
    sessionStorage.setItem("dokaniai-auth-contact", "demo@example.com");
    sessionStorage.setItem("dokaniai-auth-method", "email");
  });

  await page.route("**/auth/verify/email", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: {} }),
    });
  });

  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          accessToken: "access-token-email",
          refreshToken: "refresh-token-email",
          userId: "user-2",
          status: "AUTHENTICATED",
        },
      }),
    });
  });

  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { id: "user-2", role: "USER" } }),
    });
  });

  await page.route("**/subscriptions/current**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: "sub-2",
          userId: "user-2",
          planId: "plan-ft1",
          status: "ACTIVE",
          currentPeriodStart: "2026-04-01T00:00:00.000Z",
          currentPeriodEnd: "2026-05-01T00:00:00.000Z",
          cancelAtPeriodEnd: false,
        },
      }),
    });
  });

  await page.goto("/verify-email");
  await page.locator("form input").first().fill("123456");
  await page.locator("form button[type='submit']").click();

  await expect(page).toHaveURL(/\/login\?verified=true$/);
  await page.locator("form input").nth(0).fill("demo@example.com");
  await page.locator("form input").nth(1).fill("Passw0rd!");
  await page.locator("form button[type='submit']").click();

  await expect(page).toHaveURL(/\/subscription\/upgrade\?plan=plan-plus/);
});
