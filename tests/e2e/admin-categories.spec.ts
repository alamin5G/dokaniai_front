import { expect, test } from "@playwright/test";

const CATEGORIES_FIXTURE = [
	{
		id: "cat-001",
		parentId: null,
		nameBn: "খাদ্যদ্রব্য",
		nameEn: "Food Items",
		slug: "food-items",
		scope: "GLOBAL",
		businessType: "GROCERY",
		businessId: null,
		createdBy: "admin-1",
		isActive: true,
		isSystem: true,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
	},
	{
		id: "cat-002",
		parentId: "cat-001",
		nameBn: "চাল",
		nameEn: "Rice",
		slug: "rice",
		scope: "GLOBAL",
		businessType: "GROCERY",
		businessId: null,
		createdBy: "admin-1",
		isActive: true,
		isSystem: false,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
	},
	{
		id: "cat-003",
		parentId: "cat-001",
		nameBn: "মসলা",
		nameEn: "Spices",
		slug: "spices",
		scope: "GLOBAL",
		businessType: "GROCERY",
		businessId: null,
		createdBy: "admin-1",
		isActive: true,
		isSystem: false,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
	},
	{
		id: "cat-004",
		parentId: null,
		nameBn: "পোশাক",
		nameEn: "Clothing",
		slug: "clothing",
		scope: "GLOBAL",
		businessType: "FASHION",
		businessId: null,
		createdBy: "admin-1",
		isActive: true,
		isSystem: false,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
	},
];

const BUSINESS_BY_CATEGORY_FIXTURE = {
	content: [
		{
			businessId: "biz-001",
			businessName: "Dhaka Super Store",
			businessType: "GROCERY",
			location: "Gulshan, Dhaka",
			primaryCategory: "চাল",
			status: "ACTIVE",
		},
		{
			businessId: "biz-002",
			businessName: "Green Mart",
			businessType: "GROCERY",
			location: "Banani, Dhaka",
			primaryCategory: "চাল",
			status: "ACTIVE",
		},
	],
	number: 0,
	last: true,
	totalElements: 2,
	totalPages: 1,
};

const TAGS_FIXTURE = {
	currentTags: ["Organic", "Daily Needs"],
	suggestedTags: ["Fresh Produce", "Halal", "Local", "Imported", "Premium"],
};

const PENDING_REQUESTS_FIXTURE = {
	content: [],
	number: 0,
	last: true,
	totalPages: 1,
};

function mockAuth(page: import("@playwright/test").Page) {
	page.route("**/users/me", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: { id: "admin-1", role: "ADMIN", name: "Admin User" },
			}),
		});
	});
}

function mockCategoriesByType(page: import("@playwright/test").Page, categories: unknown[]) {
	page.route(/\/categories\/by-business-type\//, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: categories }),
		});
	});
}

function mockBusinessesByCategory(page: import("@playwright/test").Page) {
	page.route(/\/categories\/cat-002\/businesses/, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: BUSINESS_BY_CATEGORY_FIXTURE }),
		});
	});
}

function mockCategoryTags(page: import("@playwright/test").Page) {
	page.route(/\/categories\/cat-002\/tags$/, async (route) => {
		const method = route.request().method();
		if (method === "GET") {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, data: TAGS_FIXTURE }),
			});
		} else if (method === "POST") {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, data: ["Organic", "Daily Needs", "NewTag"] }),
			});
		}
	});
}

function mockCategoryTagsDelete(page: import("@playwright/test").Page) {
	page.route(/\/categories\/cat-002\/tags\//, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: null, message: "Tag removed" }),
		});
	});
}

function mockPendingRequests(page: import("@playwright/test").Page) {
	page.route(/\/category-requests\/pending/, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: PENDING_REQUESTS_FIXTURE }),
		});
	});
}

test.describe("Admin Category Management", () => {
	test("displays category tree with expandable nodes", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("dokaniai-language", JSON.stringify({ state: { locale: "en" }, version: 0 }));
		});

		mockAuth(page);
		mockCategoriesByType(page, CATEGORIES_FIXTURE);
		mockPendingRequests(page);

		await page.goto("/admin/categories");

		await expect(page.getByText("Taxonomy")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("HIERARCHY")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("খাদ্যদ্রব্য")).toBeVisible();
		await expect(page.getByText("2")).toBeVisible();
	});

	test("search filters categories", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("dokaniai-language", JSON.stringify({ state: { locale: "en" }, version: 0 }));
		});

		mockAuth(page);
		mockCategoriesByType(page, CATEGORIES_FIXTURE);
		mockPendingRequests(page);

		await page.goto("/admin/categories");
		await expect(page.getByText("খাদ্যদ্রব্য")).toBeVisible({ timeout: 10_000 });

		const searchInput = page.getByPlaceholder("Search categories...");
		await searchInput.fill("চাল");

		await expect(page.getByText("চাল")).toBeVisible();
		await expect(page.getByText("মসলা")).not.toBeVisible();
	});

	test("selecting category shows detail with dynamic businesses table", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("dokaniai-language", JSON.stringify({ state: { locale: "en" }, version: 0 }));
		});

		mockAuth(page);
		mockCategoriesByType(page, CATEGORIES_FIXTURE);
		mockPendingRequests(page);
		mockBusinessesByCategory(page);
		mockCategoryTags(page);
		mockCategoryTagsDelete(page);

		await page.goto("/admin/categories");
		await expect(page.getByText("খাদ্যদ্রব্য")).toBeVisible({ timeout: 10_000 });

		await page.getByText("চাল").first().click();

		await expect(page.getByText("Businesses in this Category")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("Dhaka Super Store")).toBeVisible();
		await expect(page.getByText("Green Mart")).toBeVisible();
		await expect(page.getByText("ACTIVE")).toBeVisible();
	});

	test("AI tags section shows current and suggested tags", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("dokaniai-language", JSON.stringify({ state: { locale: "en" }, version: 0 }));
		});

		mockAuth(page);
		mockCategoriesByType(page, CATEGORIES_FIXTURE);
		mockPendingRequests(page);
		mockBusinessesByCategory(page);
		mockCategoryTags(page);
		mockCategoryTagsDelete(page);

		await page.goto("/admin/categories");
		await expect(page.getByText("খাদ্যদ্রব্য")).toBeVisible({ timeout: 10_000 });

		await page.getByText("চাল").first().click();

		await expect(page.getByText("AI Suggested Attributes")).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText("Organic")).toBeVisible();
		await expect(page.getByText("Daily Needs")).toBeVisible();
		await expect(page.getByText("+ Fresh Produce")).toBeVisible();
		await expect(page.getByText("+ Halal")).toBeVisible();
	});

	test("switching business type reloads categories", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("dokaniai-language", JSON.stringify({ state: { locale: "en" }, version: 0 }));
		});

		mockAuth(page);
		mockCategoriesByType(page, CATEGORIES_FIXTURE);
		mockPendingRequests(page);

		await page.goto("/admin/categories");
		await expect(page.getByText("খাদ্যদ্রব্য")).toBeVisible({ timeout: 10_000 });

		const select = page.locator("select").first();
		await select.selectOption("FASHION");

		await expect(page.getByText("পোশাক")).toBeVisible({ timeout: 10_000 });
	});

	test("empty category shows placeholder state", async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem("dokaniai-language", JSON.stringify({ state: { locale: "en" }, version: 0 }));
		});

		mockAuth(page);
		mockCategoriesByType(page, []);
		mockPendingRequests(page);

		await page.goto("/admin/categories");
		await expect(page.getByText("No categories found")).toBeVisible({ timeout: 10_000 });
	});
});
