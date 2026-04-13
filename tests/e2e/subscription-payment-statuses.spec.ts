import { expect, test } from "@playwright/test";

const BUSINESS_FIXTURE = {
  id: "biz-1",
  name: "Demo Shop",
  businessType: "GROCERY",
  status: "ACTIVE",
  currency: "BDT",
  timezone: "Asia/Dhaka",
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

async function mockDashboardGuards(page: import("@playwright/test").Page) {
  await page.route("**/businesses/onboarding/my-status**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          hasActiveBusinesses: true,
          hasCompletedOnboarding: true,
          requiresOnboarding: false,
        },
      }),
    });
  });

  await page.route("**/businesses", async (route) => {
    const url = route.request().url();
    if (url.includes("/businesses/onboarding/")) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { businesses: [BUSINESS_FIXTURE], total: 1 } }),
    });
  });

  await page.route("**/businesses/biz-1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: BUSINESS_FIXTURE }),
    });
  });
}

const STATUSES = ["PENDING", "MANUAL_REVIEW", "FAILED", "EXPIRED", "COMPLETED"] as const;

for (const status of STATUSES) {
  test(`payment status page renders ${status}`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "dokaniai-auth-storage",
        JSON.stringify({ state: { accessToken: "access-token", refreshToken: "refresh-token", userId: "user-1" }, version: 0 }),
      );
    });

    await mockDashboardGuards(page);

    await page.route("**/payments/intent-xyz/status**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            paymentIntentId: "intent-xyz",
            status,
            verifiedAt: status === "COMPLETED" ? "2026-04-01T00:00:00.000Z" : null,
            failedAttempts: status === "FAILED" ? 2 : 0,
            fraudFlag: false,
          },
        }),
      });
    });

    await page.goto("/subscription/payment/intent-xyz");
    await expect(page.getByTestId("payment-status-title")).toBeVisible();
    await expect(page.getByTestId("payment-status-code")).toHaveText(status);
  });
}

