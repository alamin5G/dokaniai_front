import { expect, test } from "@playwright/test";

const TEST_BUSINESS_ID = "11111111-1111-1111-1111-111111111111";
const TEST_CUSTOMER_ID = "22222222-2222-2222-2222-222222222222";
const TEST_CUSTOMER_PHONE = "+8801712345678";

const BUSINESS_FIXTURE = {
	id: TEST_BUSINESS_ID,
	name: "Test Shop",
	businessType: "GROCERY",
	status: "ACTIVE",
	currency: "BDT",
	timezone: "Asia/Dhaka",
	createdAt: "2026-04-01T00:00:00.000Z",
	updatedAt: "2026-04-01T00:00:00.000Z",
};

const DUE_CUSTOMER = {
	customerId: TEST_CUSTOMER_ID,
	customerName: "Test Customer",
	currentBalance: 5000,
	creditLimit: null,
	totalBakiCount: 3,
	totalJomaCount: 1,
	totalBakiAmount: 5000,
	totalJomaAmount: 1000,
	lastTransactionDate: "2025-01-15",
	lastPaymentDate: "2025-01-01",
};

async function forceEnglishLocale(page: import("@playwright/test").Page) {
	await page.addInitScript(() => {
		localStorage.setItem(
			"dokaniai-language",
			JSON.stringify({ state: { locale: "en" }, version: 0 }),
		);
	});
}

async function seedAuth(page: import("@playwright/test").Page) {
	await page.addInitScript(() => {
		localStorage.setItem(
			"dokaniai-auth-storage",
			JSON.stringify({
				state: {
					accessToken: "test-token",
					refreshToken: "test-refresh",
					userId: "00000000-0000-0000-0000-000000000001",
				},
				version: 0,
			}),
		);
	});
}

async function stubCommonRoutes(page: import("@playwright/test").Page) {
	await page.route("**/subscriptions/plans**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: [] }),
		});
	});

	await page.route("**/subscriptions/current**", async (route) => {
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
			body: JSON.stringify({ success: true, data: { id: "user-1", role: "USER" } }),
		});
	});

	await page.route("**/businesses/onboarding/my-status", async (route) => {
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
}

async function stubDueLedgerRoutes(page: import("@playwright/test").Page) {
	await page.route("**/due-transactions/customers-with-due**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: [DUE_CUSTOMER] }),
		});
	});

	await page.route(`**/api/v1/businesses/${TEST_BUSINESS_ID}/customers**`, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: {
					content: [
						{
							customerId: TEST_CUSTOMER_ID,
							customerName: "Test Customer",
							phone: TEST_CUSTOMER_PHONE,
							address: null,
							runningBalance: 5000,
							creditLimit: null,
							lastTransactionAt: "2025-01-15T00:00:00.000Z",
							lastPaymentAt: "2025-01-01T00:00:00.000Z",
							status: "ACTIVE",
							createdBy: "user-1",
							createdAt: "2025-01-01T00:00:00.000Z",
							updatedAt: "2025-01-01T00:00:00.000Z",
							deletedAt: null,
						},
					],
					totalElements: 1,
					totalPages: 1,
					number: 0,
					size: 100,
				},
			}),
		});
	});
}

async function stubAiReminderRoute(
	page: import("@playwright/test").Page,
	options?: { alreadySentToday?: boolean; resetAt?: string },
) {
	await page.route("**/reminders/ai/**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: {
					customerId: TEST_CUSTOMER_ID,
					customerName: "Test Customer",
					phone: TEST_CUSTOMER_PHONE,
					link: "https://wa.me/8801712345678?text=...",
					message: "ভাইয়া, আপনার বকেয়া ৳৫,০০০ টাকা। bKash এ পাঠাতে পারেন।",
					encodedMessage: "...",
					contextType: "GENERAL",
					alreadySentToday: options?.alreadySentToday ?? false,
					resetAt: options?.resetAt ?? null,
				},
			}),
		});
	});
}

async function stubTemplateReminderRoute(page: import("@playwright/test").Page) {
	await page.route("**/customers/*/reminder**", async (route) => {
		if (route.request().method() === "POST") {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					success: true,
					data: {
						customerId: TEST_CUSTOMER_ID,
						customerName: "Test Customer",
						phone: TEST_CUSTOMER_PHONE,
						link: "https://wa.me/8801712345678?text=Custom+message",
						message: "Custom reminder message",
						encodedMessage: "Custom+reminder+message",
					},
				}),
			});
		} else {
			await route.continue();
		}
	});
}

test.describe("WhatsApp AI Reminder", () => {
	test("AI reminder modal opens and shows AI message", async ({ page }) => {
		await forceEnglishLocale(page);
		await seedAuth(page);
		await stubCommonRoutes(page);
		await stubDueLedgerRoutes(page);
		await stubAiReminderRoute(page);

		await page.goto(`/shop/${TEST_BUSINESS_ID}/due-ledger`);

		const whatsappBtn = page.locator("button.bg-\\[\\#25D366\\]").first();
		await expect(whatsappBtn).toBeVisible({ timeout: 15_000 });
		await whatsappBtn.click();

		await expect(page.locator("div.fixed.inset-0")).toBeVisible({ timeout: 10_000 });
		await expect(page.locator("div.fixed.inset-0")).toContainText("Test Customer");
		await expect(page.locator("div.fixed.inset-0")).toContainText("5,000");
		await expect(page.locator("span.text-primary.bg-primary-container\\/50")).toContainText("AI");
	});

	test("AI reminder shows daily limit warning", async ({ page }) => {
		await forceEnglishLocale(page);
		await seedAuth(page);
		await stubCommonRoutes(page);
		await stubDueLedgerRoutes(page);
		await stubAiReminderRoute(page, {
			alreadySentToday: true,
			resetAt: "2026-04-18T00:00:00.000Z",
		});

		await page.goto(`/shop/${TEST_BUSINESS_ID}/due-ledger`);

		const whatsappBtn = page.locator("button.bg-\\[\\#25D366\\]").first();
		await expect(whatsappBtn).toBeVisible({ timeout: 15_000 });
		await whatsappBtn.click();

		await expect(page.locator("div.fixed.inset-0")).toBeVisible({ timeout: 10_000 });
		await expect(page.locator("div.rounded-xl.bg-amber-50")).toBeVisible();
		await expect(page.locator("div.rounded-xl.bg-amber-50")).toContainText(/already sent today/i);
		await expect(page.locator("div.rounded-xl.bg-\\[\\#25D366\\]\\/10")).toContainText("ভাইয়া");
	});

	test("custom message toggle works", async ({ page }) => {
		await forceEnglishLocale(page);
		await seedAuth(page);
		await stubCommonRoutes(page);
		await stubDueLedgerRoutes(page);
		await stubAiReminderRoute(page);
		await stubTemplateReminderRoute(page);

		await page.goto(`/shop/${TEST_BUSINESS_ID}/due-ledger`);

		const whatsappBtn = page.locator("button.bg-\\[\\#25D366\\]").first();
		await expect(whatsappBtn).toBeVisible({ timeout: 15_000 });
		await whatsappBtn.click();

		await expect(page.locator("div.fixed.inset-0")).toBeVisible({ timeout: 10_000 });

		const customToggle = page.locator("div.fixed.inset-0").getByRole("button", { name: /custom message/i });
		await customToggle.click();

		const textarea = page.locator("div.fixed.inset-0 textarea");
		await expect(textarea).toBeVisible();
		await textarea.fill("Custom reminder text for test");

		const previewArea = page.locator("div.rounded-xl.bg-\\[\\#25D366\\]\\/10");
		await expect(previewArea).toContainText("Custom reminder message");
	});

	test("send button opens WhatsApp", async ({ page, context }) => {
		await forceEnglishLocale(page);
		await seedAuth(page);
		await stubCommonRoutes(page);
		await stubDueLedgerRoutes(page);
		await stubAiReminderRoute(page);

		await page.goto(`/shop/${TEST_BUSINESS_ID}/due-ledger`);

		const whatsappBtn = page.locator("button.bg-\\[\\#25D366\\]").first();
		await expect(whatsappBtn).toBeVisible({ timeout: 15_000 });
		await whatsappBtn.click();

		await expect(page.locator("div.fixed.inset-0")).toBeVisible({ timeout: 10_000 });

		const [popup] = await Promise.all([
			context.waitForEvent("page"),
			page.locator("button.bg-\\[\\#25D366\\]").last().click(),
		]);

		await popup.waitForLoadState("domcontentloaded");
		await expect(popup).toHaveURL(/wa\.me/);
	});

	test("close button dismisses modal", async ({ page }) => {
		await forceEnglishLocale(page);
		await seedAuth(page);
		await stubCommonRoutes(page);
		await stubDueLedgerRoutes(page);
		await stubAiReminderRoute(page);

		await page.goto(`/shop/${TEST_BUSINESS_ID}/due-ledger`);

		const whatsappBtn = page.locator("button.bg-\\[\\#25D366\\]").first();
		await expect(whatsappBtn).toBeVisible({ timeout: 15_000 });
		await whatsappBtn.click();

		await expect(page.locator("div.fixed.inset-0")).toBeVisible({ timeout: 10_000 });

		const closeBtn = page.locator("button.rounded-full").first();
		await closeBtn.click();

		await expect(page.locator("div.fixed.inset-0")).not.toBeVisible();
	});
});
