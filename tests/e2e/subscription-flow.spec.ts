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
		features: {},
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
		maxProductsPerBusiness: null,
		aiQueriesPerDay: 25,
		maxAiTokensPerQuery: 2000,
		conversationHistoryTurns: 10,
		maxQueryCharacters: 200,
		features: {},
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
		maxProductsPerBusiness: null,
		aiQueriesPerDay: 75,
		maxAiTokensPerQuery: 4000,
		conversationHistoryTurns: 20,
		maxQueryCharacters: 350,
		features: {},
		isTrial: false,
		isActive: true,
	},
];

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

test("pricing -> login -> upgrade -> payment status", async ({ page }) => {
	// Keep test deterministic by forcing English locale before app boot.
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

	await page.route("**/auth/login**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: {
					accessToken: "access-token",
					refreshToken: "refresh-token",
					userId: "user-1",
					status: "AUTHENTICATED",
				},
			}),
		});
	});

	await page.route("**/users/me**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: { id: "user-1", role: "USER" } }),
		});
	});

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

	await page.route("**/payments/initialize**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: {
					paymentIntentId: "intent-123",
					amount: 399,
					mfsMethod: "BKASH",
					receiverNumber: "01700000000",
					expiresAt: "2026-12-01T00:00:00.000Z",
					status: "PENDING",
				},
			}),
		});
	});

	await page.route("**/payments/intent-123/status**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: {
					paymentIntentId: "intent-123",
					status: "PENDING",
					verifiedAt: null,
					failedAttempts: 0,
					fraudFlag: false,
				},
			}),
		});
	});

	await page.goto("/pricing");
	await expect(page.getByText("Pricing Plans")).toBeVisible();

	// Seed the same session state used by pricing CTA for unauthenticated upgrade intent.
	await page.evaluate(() => {
		sessionStorage.setItem("pending_upgrade_plan", "plan-pro");
		sessionStorage.setItem("redirect_after_login", "/subscription/upgrade?plan=plan-pro");
	});
	await page.goto("/login");
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.locator("form input").first()).toBeVisible();
	await expect(page.locator("form button[type='submit']")).toBeVisible();

	await page.locator("form input").nth(0).fill("demo@example.com");
	await page.locator("form input").nth(1).fill("Passw0rd!");
	await page.locator("form button[type='submit']").click();

	await expect(page).toHaveURL(/\/subscription\/upgrade\?plan=/);
	await expect(page.getByTestId("subscription-upgrade-title")).toBeVisible();

	await page.getByTestId("continue-to-payment").click();

	await expect(page).toHaveURL(/\/subscription\/payment\/intent-123$/);
	await expect(page.getByTestId("payment-status-title")).toBeVisible();
	await expect(page.getByTestId("payment-current-status")).toContainText(/pending/i);
});

