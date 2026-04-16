/**
 * E2E tests for the subscription-aware auth redirect flow.
 *
 * Covers SRS §6.1 Scenarios A & B:
 *   Scenario A (Trial):  pricing → register → verify → login → FreeTrialModal → onboarding
 *   Scenario B (Paid):   pricing → register → verify → login → /subscription/upgrade?plan=...
 *   Edge case:           direct register (no plan) → verify → login → normal redirect
 *
 * All assertions use data-testid / URL matching — no locale-dependent text.
 */
import { expect, test } from "@playwright/test";

/* ────────────────────────────── fixtures ────────────────────────────── */

const PLANS_FIXTURE = [
	{
		id: "plan-ft1",
		name: "FREE_TRIAL_1",
		tierLevel: 1,
		displayNameBn: "ফ্রি ট্রায়াল ১",
		displayNameEn: "Free Trial 1",
		priceBdt: 0,
		annualPriceBdt: null,
		durationDays: 65,
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
		maxProductsPerBusiness: 100,
		aiQueriesPerDay: 25,
		maxAiTokensPerQuery: 2000,
		conversationHistoryTurns: 10,
		maxQueryCharacters: 200,
		features: {},
		isTrial: false,
		isActive: true,
	},
];

const LOGIN_RESPONSE = {
	success: true,
	data: {
		accessToken: "access-token-mock",
		refreshToken: "refresh-token-mock",
		userId: "user-1",
		status: "AUTHENTICATED",
	},
};

const USER_ME_RESPONSE = {
	success: true,
	data: { id: "user-1", role: "USER" },
};

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

/* ──────────────────────── shared route helpers ──────────────────────── */

/** Stub all API routes needed for the subscription auth flow. */
async function stubApiRoutes(page: import("@playwright/test").Page) {
	// Plans
	await page.route("**/subscriptions/plans**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: PLANS_FIXTURE }),
		});
	});

	// Current subscription (none)
	await page.route("**/subscriptions/current**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: null }),
		});
	});

	// Phone registration
	await page.route("**/auth/register/phone**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: null }),
		});
	});

	// Email registration
	await page.route("**/auth/register/email**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: null }),
		});
	});

	// OTP verification
	await page.route("**/auth/verify/phone**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: null }),
		});
	});

	// Login
	await page.route("**/auth/login**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(LOGIN_RESPONSE),
		});
	});

	// User profile
	await page.route("**/users/me**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(USER_ME_RESPONSE),
		});
	});

	// Onboarding status
	await page.route("**/businesses/onboarding/my-status**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: {
					hasActiveBusinesses: false,
					hasCompletedOnboarding: false,
					requiresOnboarding: true,
				},
			}),
		});
	});

	// Businesses list (new user — empty)
	await page.route("**/api/**/businesses**", async (route) => {
		const url = route.request().url();
		if (url.includes("/businesses/onboarding/")) {
			await route.continue();
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: { businesses: [], total: 0 } }),
		});
	});
}

/** Force English locale before app boot. */
async function forceEnglishLocale(page: import("@playwright/test").Page) {
	await page.addInitScript(() => {
		localStorage.setItem(
			"dokaniai-language",
			JSON.stringify({ state: { locale: "en" }, version: 0 }),
		);
	});
}

/** Wait for pricing plans to finish loading (quick-reference table renders). */
async function waitForPlansLoaded(page: import("@playwright/test").Page) {
	await expect(page.getByTestId("quick-reference-table")).toBeVisible({ timeout: 15_000 });
}

/** Seed auth tokens in localStorage so authenticated pages work. */
async function seedAuth(page: import("@playwright/test").Page) {
	await page.evaluate(() => {
		localStorage.setItem(
			"dokaniai-auth-storage",
			JSON.stringify({
				state: {
					accessToken: "access-token-mock",
					refreshToken: "refresh-token-mock",
					userId: "user-1",
				},
				version: 0,
			}),
		);
	});
}

/** Stub routes needed for the upgrade page (plans, current sub, referral, businesses). */
async function stubUpgradeRoutes(page: import("@playwright/test").Page, options?: { currentPlan?: string | null; plansFail?: boolean }) {
	const currentPlan = options?.currentPlan ?? null;
	const plansFail = options?.plansFail ?? false;

	await page.route("**/subscriptions/plans**", async (route) => {
		if (plansFail) {
			await route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({ success: false, error: "API Failure" }),
			});
		} else {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, data: PLANS_FIXTURE }),
			});
		}
	});
	await page.route("**/subscriptions/current**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: currentPlan ? { planId: currentPlan, status: "ACTIVE" } : null,
			}),
		});
	});
	await page.route("**/subscriptions/referral-status**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: null }),
		});
	});
	await page.route("**/users/me**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify(USER_ME_RESPONSE),
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
	await page.route("**/api/**/businesses**", async (route) => {
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
	await page.route("**/api/**/businesses/biz-1**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: BUSINESS_FIXTURE }),
		});
	});
}

/* ═══════════════════════════ TESTS ═══════════════════════════ */

/* ─── Scenario A: Free Trial Plan ─── */

test.describe("Scenario A — Free Trial plan flow", () => {
	test("pricing → register (phone) → verify OTP → login → trial modal → onboarding", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		// 1. Pricing page — wait for plans to load, then click trial CTA
		await page.goto("/pricing");
		await waitForPlansLoaded(page);

		await page.getByTestId("plan-action-plan-ft1").click();

		// 2. Should redirect to /register
		await expect(page).toHaveURL(/\/register$/);

		// Verify sessionStorage has trial plan with isTrial=true
		const storedPlan = await page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"));
		expect(storedPlan).toBe("plan-ft1");

		const isTrial = await page.evaluate(() => sessionStorage.getItem("pending_plan_is_trial"));
		expect(isTrial).toBe("true");

		// 3. Fill registration form (phone tab is default)
		// Fields: fullName (0), phone (1), referralCode (2), checkbox
		const inputs = page.locator("form input");
		await inputs.nth(0).fill("Test User");
		await inputs.nth(1).fill("01712345678");
		await page.locator("form input[type='checkbox']").check();
		await page.locator("form button[type='submit']").click();

		// 4. Should redirect to /verify-otp
		await expect(page).toHaveURL(/\/verify-otp/, { timeout: 10_000 });

		// Fill OTP (6 digits) and submit
		await page.locator("form input[type='text']").fill("123456");
		await page.locator("form button[type='submit']").click();

		// 5. Should show success state (checkmark icon) then redirect to /login
		await expect(page.locator("span.material-symbols-outlined", { hasText: "check_circle" })).toBeVisible({ timeout: 10_000 });
		await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

		// 6. Verify pending plan survived the navigation
		const planAfterVerify = await page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"));
		expect(planAfterVerify).toBe("plan-ft1");

		// Fill login form
		await page.locator("form input").nth(0).fill("01712345678");
		await page.locator("form input").nth(1).fill("Passw0rd!");
		await page.locator("form button[type='submit']").click();

		// 7. Should show the FreeTrialModal (gift icon is the hallmark)
		await expect(page.locator("span.material-symbols-outlined", { hasText: "card_giftcard" })).toBeVisible({ timeout: 10_000 });

		// 8. Click confirm button → redirect to /onboarding
		await page.getByRole("button", { name: /./ }).last().click();
		await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });

		// 9. Pending plan should be cleared after modal confirmation
		const planAfterModal = await page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"));
		expect(planAfterModal).toBeNull();
	});

	test("trial plan — sessionStorage isTrial flag is stored correctly", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		await page.goto("/pricing");
		await waitForPlansLoaded(page);

		await page.getByTestId("plan-action-plan-ft1").click();
		await expect(page).toHaveURL(/\/register$/);

		const isTrial = await page.evaluate(() => sessionStorage.getItem("pending_plan_is_trial"));
		expect(isTrial).toBe("true");

		// Trial plans should NOT set redirect_after_login
		const redirect = await page.evaluate(() => sessionStorage.getItem("redirect_after_login"));
		expect(redirect).toBeNull();
	});
});

/* ─── Scenario B: Paid Plan ─── */

test.describe("Scenario B — Paid plan flow", () => {
	test("pricing → register (email) → verify email → login → upgrade page", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		// Email verification endpoint
		await page.route("**/auth/verify/email**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, data: null }),
			});
		});

		// 1. Pricing page — click Basic plan CTA
		await page.goto("/pricing");
		await waitForPlansLoaded(page);

		await page.getByTestId("plan-action-plan-basic").click();

		// 2. Should redirect to /register with paid plan in sessionStorage
		await expect(page).toHaveURL(/\/register$/);

		const storedPlan = await page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"));
		expect(storedPlan).toBe("plan-basic");

		const isTrial = await page.evaluate(() => sessionStorage.getItem("pending_plan_is_trial"));
		expect(isTrial).toBe("false");

		const redirect = await page.evaluate(() => sessionStorage.getItem("redirect_after_login"));
		expect(redirect).toContain("/subscription/upgrade?plan=plan-basic");

		// 3. Switch to email tab
		await page.getByRole("button", { name: /email|ইমেইল/i }).click();

		// Fields on email tab: fullName (0), email (1), phone (2), password (3), referralCode (4), checkbox
		const inputs = page.locator("form input");
		await inputs.nth(0).fill("Test User");
		await inputs.nth(1).fill("user@test.com");
		await inputs.nth(2).fill("01712345678");
		await page.locator("form input[type='password']").fill("Passw0rd!");
		await page.locator("form input[type='checkbox']").check();
		await page.locator("form button[type='submit']").click();

		// 4. Should redirect to /verify-email
		await expect(page).toHaveURL(/\/verify-email/, { timeout: 10_000 });

		// Fill verification code and submit (must be 6 digits — input strips non-digits)
		await page.locator("form input[type='text']").fill("123456");
		await page.locator("form button[type='submit']").click();

		// 5. Should redirect to /login
		await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

		// 6. Login
		await page.locator("form input").nth(0).fill("user@test.com");
		await page.locator("form input").nth(1).fill("Passw0rd!");
		await page.locator("form button[type='submit']").click();

		// 7. Should redirect to /subscription/upgrade?plan=plan-basic
		await expect(page).toHaveURL(/\/subscription\/upgrade\?plan=plan-basic/, { timeout: 10_000 });
	});

	test("paid plan — redirect URL contains correct planId", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		await page.goto("/pricing");
		await waitForPlansLoaded(page);

		await page.getByTestId("plan-action-plan-basic").click();
		await expect(page).toHaveURL(/\/register$/);

		const redirect = await page.evaluate(() => sessionStorage.getItem("redirect_after_login"));
		expect(redirect).toBe("/subscription/upgrade?plan=plan-basic");
	});
});

/* ─── Edge Case: No Plan Selected ─── */

test.describe("Edge case — no plan selected", () => {
	test("direct register (phone) → verify → login → trial modal → onboarding", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		await page.goto("/register");

		const storedPlan = await page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"));
		expect(storedPlan).toBeNull();

		const inputs = page.locator("form input");
		await inputs.nth(0).fill("Test User");
		await inputs.nth(1).fill("01712345678");
		await page.locator("form input[type='checkbox']").check();
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/verify-otp/, { timeout: 10_000 });
		await page.locator("form input[type='text']").fill("123456");
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

		await page.locator("form input").nth(0).fill("01712345678");
		await page.locator("form input").nth(1).fill("Passw0rd!");
		await page.locator("form button[type='submit']").click();

		await expect(
			page.locator("span.material-symbols-outlined", { hasText: "card_giftcard" }),
		).toBeVisible({ timeout: 10_000 });

		await page.getByRole("button", { name: /./ }).last().click();
		await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });
	});

	test("direct register (email) → verify → login → trial modal → onboarding", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		await page.route("**/auth/verify/email**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, data: null }),
			});
		});

		await page.goto("/register");

		await page.getByRole("button", { name: /email|ইমেইল/i }).click();

		const inputs = page.locator("form input");
		await inputs.nth(0).fill("Test User");
		await inputs.nth(1).fill("user@test.com");
		await inputs.nth(2).fill("01712345678");
		await page.locator("form input[type='password']").fill("Passw0rd!");
		await page.locator("form input[type='checkbox']").check();
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/verify-email/, { timeout: 10_000 });
		await page.locator("form input[type='text']").fill("123456");
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

		await page.locator("form input").nth(0).fill("user@test.com");
		await page.locator("form input").nth(1).fill("Passw0rd!");
		await page.locator("form button[type='submit']").click();

		await expect(
			page.locator("span.material-symbols-outlined", { hasText: "card_giftcard" }),
		).toBeVisible({ timeout: 10_000 });

		await page.getByRole("button", { name: /./ }).last().click();
		await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });
	});

	test("existing user with businesses → login → workspace (no trial modal)", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		await page.route("**/api/**/businesses**", async (route) => {
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
		await page.route("**/api/**/businesses/biz-1", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, data: BUSINESS_FIXTURE }),
			});
		});
		await page.route("**/businesses/onboarding/my-status", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					success: true,
					data: { hasActiveBusinesses: true, hasCompletedOnboarding: true, requiresOnboarding: false },
				}),
			});
		});

		await page.goto("/login");

		await page.locator("form input").nth(0).fill("user@test.com");
		await page.locator("form input").nth(1).fill("Passw0rd!");
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/businesses|\/shop\/biz-1/, { timeout: 10_000 });
	});
});

/* ─── Edge Case: Consumed redirect cannot be reused ─── */

test.describe("Edge case — redirect consumption", () => {
	test("paid plan redirect is consumed after login (sessionStorage cleared)", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		// Seed paid plan in sessionStorage directly (simulating prior pricing selection)
		await page.goto("/login");
		await page.evaluate(() => {
			sessionStorage.setItem("pending_upgrade_plan", "plan-basic");
			sessionStorage.setItem("pending_plan_is_trial", "false");
			sessionStorage.setItem("redirect_after_login", "/subscription/upgrade?plan=plan-basic");
		});

		// Login
		await page.locator("form input").nth(0).fill("user@test.com");
		await page.locator("form input").nth(1).fill("Passw0rd!");
		await page.locator("form button[type='submit']").click();

		// Should redirect to upgrade page (consuming the redirect)
		await expect(page).toHaveURL(/\/subscription\/upgrade\?plan=plan-basic/, { timeout: 10_000 });

		// The pending plan should now be cleared
		const planAfter = await page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"));
		expect(planAfter).toBeNull();
	});
});

/* ─── Edge Case: Admin login ignores pending plan ─── */

test.describe("Edge case — admin login", () => {
	test("admin login redirects to /admin even with pending trial plan", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		// Override /users/me to return ADMIN role
		await page.route("**/users/me**", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, data: { id: "admin-1", role: "ADMIN" } }),
			});
		});

		// Seed trial plan in sessionStorage
		await page.goto("/login");
		await page.evaluate(() => {
			sessionStorage.setItem("pending_upgrade_plan", "plan-ft1");
			sessionStorage.setItem("pending_plan_is_trial", "true");
		});

		// Login as admin
		await page.locator("form input").nth(0).fill("admin@dokaniai.com");
		await page.locator("form input").nth(1).fill("AdminPass!");
		await page.locator("form button[type='submit']").click();

		// Should redirect to /admin (not trial modal, not onboarding)
		await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
	});
});

/* ═════════════════════════════════════════════════════════════════════════
 * Additional Edge Cases — rewritten from user test plans
 * ═════════════════════════════════════════════════════════════════════════ */

/* ─── Edge: FT1 auto-assignment — full flow confirms trial modal ─── */

test("Edge — FT1 auto-assign › full trial flow shows modal before onboarding", async ({ page }) => {
	await forceEnglishLocale(page);
	await stubApiRoutes(page);

	// 1. Pricing → click trial plan
	await page.goto("/pricing");
	await waitForPlansLoaded(page);
	await page.getByTestId("plan-action-plan-ft1").click();
	await expect(page).toHaveURL(/\/register$/);

	// 2. Register (phone)
	const inputs = page.locator("form input");
	await inputs.nth(0).fill("Trial User");
	await inputs.nth(1).fill("01700000003");
	await page.locator("form input[type='checkbox']").check();
	await page.locator("form button[type='submit']").click();

	// 3. Verify OTP
	await expect(page).toHaveURL(/\/verify-otp/, { timeout: 10_000 });
	await page.locator("form input[type='text']").fill("123456");
	await page.locator("form button[type='submit']").click();

	// 4. Redirect to login
	await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

	// 5. Login → trial modal should appear (NOT direct onboarding)
	await page.locator("form input").nth(0).fill("01700000003");
	await page.locator("form input").nth(1).fill("Passw0rd!");
	await page.locator("form button[type='submit']").click();

	// Trial modal must appear before any redirect
	await expect(
		page.locator("span.material-symbols-outlined", { hasText: "card_giftcard" }),
	).toBeVisible({ timeout: 10_000 });

	// 6. Confirm modal → onboarding
	await page.getByRole("button", { name: /./ }).last().click();
	await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });
});

/* ─── Edge: sessionStorage lost before verification ─── */

test("Edge — lost sessionStorage before verification › trial modal still shows for new user", async ({ page }) => {
	await forceEnglishLocale(page);
	await stubApiRoutes(page);

	await page.goto("/pricing");
	await waitForPlansLoaded(page);
	await page.getByTestId("plan-action-plan-basic").click();
	await expect(page).toHaveURL(/\/register$/);

	await page.evaluate(() => sessionStorage.clear());

	const inputs = page.locator("form input");
	await inputs.nth(0).fill("Session User");
	await inputs.nth(1).fill("01700000004");
	await page.locator("form input[type='checkbox']").check();
	await page.locator("form button[type='submit']").click();

	await expect(page).toHaveURL(/\/verify-otp/, { timeout: 10_000 });
	await page.locator("form input[type='text']").fill("123456");
	await page.locator("form button[type='submit']").click();

	await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

	await page.locator("form input").nth(0).fill("01700000004");
	await page.locator("form input").nth(1).fill("Passw0rd!");

	await page.locator("form button[type='submit']").click();

	await expect(
		page.locator("span.material-symbols-outlined", { hasText: "card_giftcard" }),
	).toBeVisible({ timeout: 10_000 });

	await page.getByRole("button", { name: /./ }).last().click();
	await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });
});

/* ─── Edge: Multiple plan clicks — last one persists ─── */

test("Edge — multiple plan selection › last clicked plan should persist", async ({ page }) => {
	await forceEnglishLocale(page);
	await stubApiRoutes(page);

	// 1. Click trial plan first
	await page.goto("/pricing");
	await waitForPlansLoaded(page);
	await page.getByTestId("plan-action-plan-ft1").click();
	await expect(page).toHaveURL(/\/register$/);

	// 2. Go back and click paid plan
	await page.goto("/pricing");
	await waitForPlansLoaded(page);
	await page.getByTestId("plan-action-plan-basic").click();
	await expect(page).toHaveURL(/\/register$/);

	// 3. Last clicked plan (basic) should be in sessionStorage
	const storedPlan = await page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"));
	expect(storedPlan).toBe("plan-basic");

	const isTrial = await page.evaluate(() => sessionStorage.getItem("pending_plan_is_trial"));
	expect(isTrial).toBe("false");

	const redirect = await page.evaluate(() => sessionStorage.getItem("redirect_after_login"));
	expect(redirect).toContain("/subscription/upgrade?plan=plan-basic");
});

/* ─── Edge: Direct upgrade page without auth → redirect to login ─── */

test("Edge — direct upgrade access without auth › should redirect to login", async ({ page }) => {
	await forceEnglishLocale(page);
	await stubApiRoutes(page);

	// Navigate directly to upgrade page without auth token
	await page.goto("/subscription/upgrade?plan=plan-basic");

	// Upgrade page checks for auth token and redirects to /login
	await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
});

/* ─── Edge: Direct upgrade page with auth + pending plan → shows upgrade ─── */

test("Edge — direct upgrade access with auth and pending plan › shows upgrade page", async ({ page }) => {
	await forceEnglishLocale(page);
	await stubUpgradeRoutes(page);

	await page.addInitScript(() => {
		localStorage.setItem(
			"dokaniai-auth-storage",
			JSON.stringify({
				state: {
					accessToken: "access-token-mock",
					refreshToken: "refresh-token-mock",
					userId: "user-1",
				},
				version: 0,
			}),
		);
		sessionStorage.setItem("pending_upgrade_plan", "plan-basic");
		sessionStorage.setItem("pending_plan_is_trial", "false");
	});

	await page.goto("/subscription/upgrade?plan=plan-basic");

	// Should show upgrade page title
	await expect(page.getByTestId("subscription-upgrade-title")).toBeVisible({ timeout: 10_000 });

	// continue-to-payment button should be visible and enabled
	const cta = page.getByTestId("continue-to-payment");
	await expect(cta).toBeVisible();
	await expect(cta).toBeEnabled();
});

/* ─── Edge: Admin login with pending trial (correct selectors) ─── */

test("Edge — admin login with pending trial › redirects to admin dashboard", async ({ page }) => {
	await forceEnglishLocale(page);
	await stubApiRoutes(page);

	// Override /users/me to return ADMIN role
	await page.route("**/users/me**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: { id: "admin-1", role: "ADMIN" } }),
		});
	});

	// Seed trial plan in sessionStorage
	await page.goto("/login");
	await page.evaluate(() => {
		sessionStorage.setItem("pending_upgrade_plan", "plan-ft1");
		sessionStorage.setItem("pending_plan_is_trial", "true");
	});

	// Login as admin using actual form selectors
	await page.locator("form input").nth(0).fill("admin@example.com");
	await page.locator("form input").nth(1).fill("AdminPass!");
	await page.locator("form button[type='submit']").click();

	await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
});

/* ─── Edge: Same plan purchase — current plan button disabled ─── */

test("Edge — same plan purchase › continue-to-payment button disabled for current plan", async ({ page }) => {
	await forceEnglishLocale(page);
	await stubUpgradeRoutes(page, { currentPlan: "plan-basic" });

	// Seed auth
	await page.goto("/login");
	await seedAuth(page);

	await page.goto("/subscription/upgrade?plan=plan-basic");

	// Upgrade page should render
	await expect(page.getByTestId("subscription-upgrade-title")).toBeVisible({ timeout: 10_000 });

	// continue-to-payment should be disabled because plan matches current subscription
	const cta = page.getByTestId("continue-to-payment");
	await expect(cta).toBeDisabled();
});

/* ─── Edge: Upgrade page — plans API failure shows error ─── */

test("Edge — upgrade page plans API down › shows error notice", async ({ page }) => {
	await forceEnglishLocale(page);
	await stubUpgradeRoutes(page, { plansFail: true });

	// Seed auth
	await page.goto("/login");
	await seedAuth(page);

	await page.goto("/subscription/upgrade?plan=plan-basic");

	// Page should still render the title
	await expect(page.getByTestId("subscription-upgrade-title")).toBeVisible({ timeout: 10_000 });

	// Error notice should appear (the notice div rendered when plans fail to load)
	// The upgrade page shows a notice div with the error message
	await expect(page.locator("div.rounded-\\[1rem\\].border.border-outline-variant\\/30.bg-surface-container")).toBeVisible({ timeout: 10_000 });
});

/* ─── Edge: Payment initialization failure shows error ─── */

test("Edge — payment initialization failure › shows error on upgrade page", async ({ page }) => {
	await forceEnglishLocale(page);
	await stubUpgradeRoutes(page);

	// Stub payment initialization to fail
	await page.route("**/payments/initialize**", async (route) => {
		await route.fulfill({
			status: 500,
			contentType: "application/json",
			body: JSON.stringify({ success: false, error: "Payment processing failed" }),
		});
	});

	// Seed auth
	await page.goto("/login");
	await seedAuth(page);

	await page.goto("/subscription/upgrade?plan=plan-basic");

	// Wait for upgrade page to load
	await expect(page.getByTestId("subscription-upgrade-title")).toBeVisible({ timeout: 10_000 });

	// Click continue-to-payment
	await page.getByTestId("continue-to-payment").click();

	// Error notice should appear
	await expect(page.locator("div.rounded-\\[1rem\\].border.border-outline-variant\\/30.bg-surface-container")).toBeVisible({ timeout: 10_000 });
});

/* ─── Edge: Upgrade page without pending plan but with auth → shows page normally ─── */

test("Edge — upgrade page with auth but no pending plan › shows upgrade page", async ({ page }) => {
	await forceEnglishLocale(page);
	await stubUpgradeRoutes(page);

	// Seed auth only (no pending plan)
	await page.goto("/login");
	await seedAuth(page);

	await page.goto("/subscription/upgrade");

	// Should show upgrade page (selects first non-trial plan by default)
	await expect(page.getByTestId("subscription-upgrade-title")).toBeVisible({ timeout: 10_000 });
});

/* ═════════════════════════════════════════════════════════════════════════
 * Comprehensive Flow Tests — matching SRS §6.1 step-by-step verification
 * ═════════════════════════════════════════════════════════════════════════ */

test.describe("Flow — New user registration (no plan selected)", () => {
	test("Step 1-5: register(email) → verify → login → trial modal confirm → onboarding", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		await page.route("**/auth/verify/email**", async (route) => {
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: null }) });
		});

		await page.goto("/register");
		await expect(page).toHaveURL(/\/register$/);

		await page.getByRole("button", { name: /email|ইমেইল/i }).click();
		const inputs = page.locator("form input");
		await inputs.nth(0).fill("New User");
		await inputs.nth(1).fill("newuser@test.com");
		await inputs.nth(2).fill("01711111111");
		await page.locator("form input[type='password']").fill("Passw0rd!");
		await page.locator("form input[type='checkbox']").check();
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/verify-email/, { timeout: 10_000 });
		await page.locator("form input[type='text']").fill("123456");
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

		await page.locator("form input").nth(0).fill("newuser@test.com");
		await page.locator("form input").nth(1).fill("Passw0rd!");
		await page.locator("form button[type='submit']").click();

		await expect(page.locator("span.material-symbols-outlined", { hasText: "card_giftcard" })).toBeVisible({ timeout: 10_000 });

		await page.getByRole("button", { name: /./ }).last().click();
		await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });

		const planAfterModal = await page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"));
		expect(planAfterModal).toBeNull();
	});
});

test.describe("Flow — Non-auth user clicks paid plan", () => {
	test("Step 1-7: click Basic → register → verify → login → upgrade page → payment", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		await page.route("**/auth/verify/email**", async (route) => {
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: null }) });
		});

		await page.route("**/api/**/businesses**", async (route) => {
			const url = route.request().url();
			if (url.includes("/businesses/onboarding/")) { await route.continue(); return; }
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { businesses: [BUSINESS_FIXTURE], total: 1 } }) });
		});
		await page.route("**/businesses/onboarding/my-status**", async (route) => {
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { hasActiveBusinesses: true, hasCompletedOnboarding: true, requiresOnboarding: false } }) });
		});

		await page.goto("/pricing");
		await waitForPlansLoaded(page);

		await page.getByTestId("plan-action-plan-basic").click();
		await expect(page).toHaveURL(/\/register$/);

		const storedPlan = await page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"));
		expect(storedPlan).toBe("plan-basic");
		const redirect = await page.evaluate(() => sessionStorage.getItem("redirect_after_login"));
		expect(redirect).toContain("/subscription/upgrade?plan=plan-basic");

		await page.getByRole("button", { name: /email|ইমেইল/i }).click();
		const inputs = page.locator("form input");
		await inputs.nth(0).fill("Paid User");
		await inputs.nth(1).fill("paid@test.com");
		await inputs.nth(2).fill("01722222222");
		await page.locator("form input[type='password']").fill("Passw0rd!");
		await page.locator("form input[type='checkbox']").check();
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/verify-email/, { timeout: 10_000 });
		await page.locator("form input[type='text']").fill("123456");
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

		await page.route("**/api/**/businesses**", async (route) => {
			const url = route.request().url();
			if (url.includes("/businesses/onboarding/")) { await route.continue(); return; }
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { businesses: [BUSINESS_FIXTURE], total: 1 } }) });
		});
		await page.route("**/api/**/businesses/biz-1**", async (route) => {
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: BUSINESS_FIXTURE }) });
		});

		await page.locator("form input").nth(0).fill("paid@test.com");
		await page.locator("form input").nth(1).fill("Passw0rd!");
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/subscription\/upgrade\?plan=plan-basic/, { timeout: 10_000 });

		const planAfterLogin = await page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"));
		expect(planAfterLogin).toBeNull();
	});
});

test.describe("Flow — Existing user clicks paid plan (already logged in)", () => {
	test("click Basic → goes directly to upgrade page (no register/login)", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubUpgradeRoutes(page);

		await page.goto("/login");
		await seedAuth(page);

		await page.goto("/pricing");
		await waitForPlansLoaded(page);

		await page.getByTestId("plan-action-plan-basic").click();
		await expect(page).toHaveURL(/\/subscription\/upgrade\?plan=plan-basic/, { timeout: 10_000 });
	});
});

test.describe("Flow — businesses API failure during login", () => {
	test("businesses API fails → falls back to workspace redirect", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		await page.route("**/api/**/businesses**", async (route) => {
			const url = route.request().url();
			if (url.includes("/businesses/onboarding/")) { await route.continue(); return; }
			await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ success: false, error: "Server error" }) });
		});

		await page.goto("/login");
		await page.locator("form input").nth(0).fill("user@test.com");
		await page.locator("form input").nth(1).fill("Passw0rd!");
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/businesses/, { timeout: 10_000 });
	});
});

test.describe("Flow — pending paid plan takes priority over trial modal", () => {
	test("new user with pending paid plan → skips trial modal → goes to upgrade", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		await page.route("**/api/**/businesses**", async (route) => {
			const url = route.request().url();
			if (url.includes("/businesses/onboarding/")) { await route.continue(); return; }
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { businesses: [BUSINESS_FIXTURE], total: 1 } }) });
		});
		await page.route("**/api/**/businesses/biz-1**", async (route) => {
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: BUSINESS_FIXTURE }) });
		});
		await page.route("**/businesses/onboarding/my-status**", async (route) => {
			await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: { hasActiveBusinesses: true, hasCompletedOnboarding: true, requiresOnboarding: false } }) });
		});

		await page.goto("/login");
		await page.evaluate(() => {
			sessionStorage.setItem("pending_upgrade_plan", "plan-basic");
			sessionStorage.setItem("pending_plan_is_trial", "false");
			sessionStorage.setItem("redirect_after_login", "/subscription/upgrade?plan=plan-basic");
		});

		await page.locator("form input").nth(0).fill("user@test.com");
		await page.locator("form input").nth(1).fill("Passw0rd!");
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/subscription\/upgrade\?plan=plan-basic/, { timeout: 10_000 });
	});
});

test.describe("Flow — trial modal confirmation clears all pending state", () => {
	test("after modal confirm, sessionStorage is clean and onboarding loads", async ({ page }) => {
		await forceEnglishLocale(page);
		await stubApiRoutes(page);

		await page.goto("/pricing");
		await waitForPlansLoaded(page);
		await page.getByTestId("plan-action-plan-ft1").click();
		await expect(page).toHaveURL(/\/register$/);

		const inputs = page.locator("form input");
		await inputs.nth(0).fill("Clean State");
		await inputs.nth(1).fill("01755555555");
		await page.locator("form input[type='checkbox']").check();
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/verify-otp/, { timeout: 10_000 });
		await page.locator("form input[type='text']").fill("123456");
		await page.locator("form button[type='submit']").click();

		await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

		await page.locator("form input").nth(0).fill("01755555555");
		await page.locator("form input").nth(1).fill("Passw0rd!");
		await page.locator("form button[type='submit']").click();

		await expect(page.locator("span.material-symbols-outlined", { hasText: "card_giftcard" })).toBeVisible({ timeout: 10_000 });

		await page.getByRole("button", { name: /./ }).last().click();
		await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });

		const plan = await page.evaluate(() => sessionStorage.getItem("pending_upgrade_plan"));
		expect(plan).toBeNull();
		const trial = await page.evaluate(() => sessionStorage.getItem("pending_plan_is_trial"));
		expect(trial).toBeNull();
		const redirect = await page.evaluate(() => sessionStorage.getItem("redirect_after_login"));
		expect(redirect).toBeNull();
	});
});
