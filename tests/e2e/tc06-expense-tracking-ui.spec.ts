import { expect, test, type Page } from "@playwright/test";

const TEST_BIZ_ID = "biz-00000006";

type Expense = {
  id: string;
  businessId: string;
  category: string;
  customCategoryName: string | null;
  amount: number;
  description: string | null;
  expenseDate: string;
  paymentMethod: string | null;
  paymentStatus: string;
  receiptUrl: string | null;
  vendorId: string | null;
  vendorName: string | null;
  expenseType: "FIXED" | "VARIABLE";
  isRecurring: boolean;
  recordedVia: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type ExpenseCategory = {
  id: string;
  name: string;
  nameBn: string | null;
  displayName: string;
  scope: "GLOBAL" | "BUSINESS";
  businessId: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
};

const TC06_UI_CASES = [
  "TC-06-086",
  "TC-06-087",
  "TC-06-088",
  "TC-06-089",
  "TC-06-090",
  "TC-06-091",
  "TC-06-092",
  "TC-06-093",
  "TC-06-094",
  "TC-06-095",
  "TC-06-096",
  "TC-06-097",
] as const;

const baseDate = "2026-05-04T00:00:00.000Z";

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "exp-1",
    businessId: TEST_BIZ_ID,
    category: "SUPPLIES",
    customCategoryName: null,
    amount: 100,
    description: "Office supplies",
    expenseDate: baseDate,
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    receiptUrl: null,
    vendorId: null,
    vendorName: null,
    expenseType: "VARIABLE",
    isRecurring: false,
    recordedVia: "MANUAL",
    createdBy: "user-1",
    createdAt: baseDate,
    updatedAt: baseDate,
    deletedAt: null,
    ...overrides,
  };
}

function category(overrides: Partial<ExpenseCategory>): ExpenseCategory {
  return {
    id: "cat-supplies",
    name: "SUPPLIES",
    nameBn: "সরবরাহ",
    displayName: "Supplies",
    scope: "GLOBAL",
    businessId: null,
    icon: "inventory_2",
    color: "#2277AA",
    sortOrder: 1,
    isActive: true,
    createdBy: null,
    createdAt: baseDate,
    ...overrides,
  };
}

async function seedAuthenticatedExpenseApi(page: Page) {
  let expenses: Expense[] = Array.from({ length: 25 }, (_, index) =>
    expense({
      id: `exp-${index + 1}`,
      category: index % 3 === 0 ? "RENT" : index % 3 === 1 ? "SUPPLIES" : "TRANSPORT",
      amount: 100 + index,
      description: index === 0 ? "Monthly rent" : `Expense ${index + 1}`,
      vendorId: index === 1 ? "vendor-1" : null,
      vendorName: index === 1 ? "Rahim Traders" : null,
      expenseType: index === 0 ? "FIXED" : "VARIABLE",
      isRecurring: index === 0,
      expenseDate: index < 10 ? "2026-05-04T00:00:00.000Z" : "2026-04-10T00:00:00.000Z",
    }),
  );

  let categories: ExpenseCategory[] = [
    category({ id: "cat-supplies", name: "SUPPLIES", displayName: "Supplies", nameBn: "সরবরাহ" }),
    category({ id: "cat-rent", name: "RENT", displayName: "Rent", nameBn: "ভাড়া", icon: "home" }),
    category({ id: "cat-utilities", name: "UTILITIES", displayName: "Utilities", nameBn: "ইউটিলিটি", icon: "bolt" }),
    category({ id: "cat-transport", name: "TRANSPORT", displayName: "Transport", nameBn: "যানবাহন", icon: "local_shipping" }),
    category({ id: "cat-custom", name: "CUSTOM", displayName: "Custom/Other", nameBn: "অন্যান্য", icon: "label" }),
  ];

  await page.addInitScript(() => {
    localStorage.setItem(
      "dokaniai-auth-storage",
      JSON.stringify({
        state: {
          accessToken: "tc06-token",
          refreshToken: "tc06-refresh",
          userId: "user-1",
          userRole: "USER",
          status: "AUTHENTICATED",
        },
        version: 0,
      }),
    );
    localStorage.setItem("dokaniai-language", JSON.stringify({ state: { locale: "en" }, version: 0 }));
    localStorage.setItem(
      "dokaniai-business-storage",
      JSON.stringify({
        state: {
          activeBusinessId: "biz-00000006",
          activeBusiness: {
            id: "biz-00000006",
            name: "Expense Shop",
            status: "ACTIVE",
            type: "GROCERY",
          },
        },
        version: 0,
      }),
    );
  });

  await page.route("**/users/me**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { id: "user-1", role: "USER" } }),
    }),
  );

  await page.route("**/businesses/onboarding/my-status**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { hasActiveBusinesses: true, hasCompletedOnboarding: true, requiresOnboarding: false },
      }),
    }),
  );

  await page.route("**/subscriptions/current**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: "sub-tc06",
          userId: "user-1",
          planId: "plus",
          status: "ACTIVE",
          currentPeriodStart: "2026-05-01T00:00:00.000Z",
          currentPeriodEnd: "2026-06-01T00:00:00.000Z",
          cancelAtPeriodEnd: false,
          billingCycle: "MONTHLY",
        },
      }),
    }),
  );

  await page.route("**/api/**/businesses**", (route) => {
    const url = new URL(route.request().url());
    const business = { id: TEST_BIZ_ID, name: "Expense Shop", status: "ACTIVE", type: "GROCERY" };
    if (url.pathname.endsWith(`/businesses/${TEST_BIZ_ID}`)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: business }),
      });
    }
    if (url.pathname.endsWith("/businesses")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { businesses: [business], total: 1 } }),
      });
    }
    return route.fallback();
  });

  await page.route(`**/businesses/${TEST_BIZ_ID}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { id: TEST_BIZ_ID, name: "Expense Shop", status: "ACTIVE", type: "GROCERY" },
      }),
    }),
  );

  await page.route(`**/api/**/businesses/${TEST_BIZ_ID}/vendors/active**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: "vendor-1",
            businessId: TEST_BIZ_ID,
            name: "Rahim Traders",
            phone: "01711234567",
            address: "Dhaka",
            notes: null,
            isActive: true,
            createdBy: "user-1",
            createdAt: baseDate,
            updatedAt: baseDate,
            deletedAt: null,
          },
        ],
      }),
    }),
  );

  await page.route(`**/api/**/businesses/${TEST_BIZ_ID}/vendors`, async (route) => {
    const body = await route.request().postDataJSON().catch(() => ({}));
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          id: "vendor-new",
          businessId: TEST_BIZ_ID,
          name: body.name ?? "New Vendor",
          phone: null,
          address: null,
          notes: null,
          isActive: true,
          createdBy: "user-1",
          createdAt: baseDate,
          updatedAt: baseDate,
          deletedAt: null,
        },
      }),
    });
  });

  await page.route(`**/api/**/businesses/${TEST_BIZ_ID}/expenses/categories**`, async (route) => {
    if (route.request().method() === "POST") {
      const body = await route.request().postDataJSON();
      const created = category({
        id: `cat-${body.name}`,
        name: body.name,
        nameBn: body.nameBn ?? null,
        displayName: body.nameBn ?? body.name,
        scope: "BUSINESS",
        businessId: TEST_BIZ_ID,
        icon: "campaign",
      });
      categories = [...categories, created];
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: created }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: categories }),
    });
  });

  await page.route(`**/api/**/businesses/${TEST_BIZ_ID}/expenses/summary**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          year: 2026,
          month: 5,
          totalExpenses: expenses.reduce((sum, item) => sum + item.amount, 0),
          expenseCount: expenses.length,
          categories: [
            { category: "RENT", categoryName: "Rent", count: 1, totalAmount: 12000, percentage: 60 },
            { category: "SUPPLIES", categoryName: "Supplies", count: 10, totalAmount: 5000, percentage: 25 },
            { category: "TRANSPORT", categoryName: "Transport", count: 8, totalAmount: 3000, percentage: 15 },
          ],
        },
      }),
    }),
  );

  await page.route(`**/api/**/businesses/${TEST_BIZ_ID}/expenses/alerts**`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [] }) }),
  );

  await page.route(`**/api/**/businesses/${TEST_BIZ_ID}/expenses/**`, async (route) => {
    const url = new URL(route.request().url());
    const id = url.pathname.split("/").at(-1);
    if (route.request().method() === "DELETE" && id) {
      expenses = expenses.filter((item) => item.id !== id);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    }
    if (route.request().method() === "PUT" && id) {
      const body = await route.request().postDataJSON();
      expenses = expenses.map((item) => (item.id === id ? { ...item, ...body, id } : item));
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: expenses.find((item) => item.id === id) }),
      });
    }
    return route.fallback();
  });

  await page.route(`**/api/**/businesses/${TEST_BIZ_ID}/expenses**`, async (route) => {
    const url = new URL(route.request().url());
    if (
      url.pathname.includes("/expenses/categories") ||
      url.pathname.includes("/expenses/summary") ||
      url.pathname.includes("/expenses/alerts")
    ) {
      return route.fallback();
    }
    const parts = url.pathname.split("/");
    const expensesIndex = parts.lastIndexOf("expenses");
    const expenseId = expensesIndex >= 0 ? parts[expensesIndex + 1] : undefined;
    if (route.request().method() === "DELETE" && expenseId) {
      expenses = expenses.filter((item) => item.id !== expenseId);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    }
    if (route.request().method() === "PUT" && expenseId) {
      const body = await route.request().postDataJSON();
      expenses = expenses.map((item) => (item.id === expenseId ? { ...item, ...body, id: expenseId } : item));
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: expenses.find((item) => item.id === expenseId) }),
      });
    }
    if (route.request().method() === "POST") {
      const body = await route.request().postDataJSON();
      const created = expense({
        id: "exp-created",
        category: body.category,
        customCategoryName: body.customCategoryName ?? null,
        amount: Number(body.amount),
        description: body.description ?? null,
        expenseDate: body.expenseDate ?? baseDate,
        paymentMethod: body.paymentMethod ?? "CASH",
        vendorId: body.vendorId ?? null,
        vendorName: body.vendorName ?? (body.vendorId ? "Rahim Traders" : null),
        expenseType: body.expenseType ?? "VARIABLE",
        isRecurring: Boolean(body.isRecurring),
        recordedVia: body.recordedVia ?? "MANUAL",
      });
      expenses = [created, ...expenses];
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: created }),
      });
    }

    const pageNumber = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 12);
    const categoryFilter = url.searchParams.get("category");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    let filtered = [...expenses];
    if (categoryFilter) filtered = filtered.filter((item) => item.category === categoryFilter);
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      filtered = filtered.filter((item) => {
        const date = new Date(item.expenseDate).getTime();
        return date >= start && date <= end;
      });
    }
    const offset = pageNumber * size;
    const content = filtered.slice(offset, offset + size);
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          content,
          totalElements: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / size)),
          size,
          number: pageNumber,
          first: pageNumber === 0,
          last: offset + size >= filtered.length,
        },
      }),
    });
  });
}

async function gotoExpenses(page: Page) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await seedAuthenticatedExpenseApi(page);
  const response = await page.goto(`/shop/${TEST_BIZ_ID}/expenses`);
  expect(response?.status()).toBeLessThan(500);
  try {
    await expect(page.getByText("Expense Records")).toBeVisible();
  } catch (error) {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    throw new Error(`Expense workspace did not render. URL: ${page.url()}. Page errors: ${pageErrors.join(" | ")}. Body: ${bodyText.slice(0, 1000)}`, {
      cause: error,
    });
  }
}

async function chooseCategory(page: Page, categoryName: string) {
  await page.getByPlaceholder("Select category").click();
  await page.getByRole("button", { name: categoryName }).first().click();
}

test.describe("TC-06 Expense Tracking — Frontend UI", () => {
  test("TC-06-086 ExpensePageShell responsive layout", async ({ page }) => {
    expect(TC06_UI_CASES).toHaveLength(12);
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoExpenses(page);
    for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      await expect(page.getByText("Expense Records")).toBeVisible();
      await expect(page.getByText("Record New Expense")).toBeVisible();
    }
  });

  test("TC-06-087 ExpensePageShell create expense form", async ({ page }) => {
    await gotoExpenses(page);
    await chooseCategory(page, "Supplies");
    await page.getByPlaceholder("0").fill("455.25");
    await page.getByPlaceholder("Brief note about this expense").fill("New stationery");
    await page.getByRole("button", { name: "Record Expense" }).click();
    await expect(page.getByText("Expense recorded successfully.")).toBeVisible();
    await expect(page.getByText("New stationery")).toBeVisible();
  });

  test("TC-06-088 ExpensePageShell date range filter", async ({ page }) => {
    await gotoExpenses(page);
    await page.getByLabel("Start date").fill("2026-05-01");
    await page.getByLabel("End date").fill("2026-05-31");
    await expect(page.getByText("Expense 12")).toHaveCount(0);
    await expect(page.getByText("Expense 2")).toBeVisible();
  });

  test("TC-06-089 ExpensePageShell category filter", async ({ page }) => {
    await gotoExpenses(page);
    await page.locator("select").first().selectOption("RENT");
    await expect(page.getByText("Monthly rent")).toBeVisible();
    await expect(page.locator("tbody").getByText("Expense 2")).toHaveCount(0);
  });

  test("TC-06-090 Expense form accepts Bangla text and amount", async ({ page }) => {
    await gotoExpenses(page);
    await chooseCategory(page, "Utilities");
    await page.getByPlaceholder("0").fill("৫০০.৭৫");
    await expect(page.getByPlaceholder("0")).toHaveValue("500.75");
    await page.getByPlaceholder("Brief note about this expense").fill("বিজলি বিল মে ২০২৬");
    await page.getByRole("button", { name: "Record Expense" }).click();
    await expect(page.getByText("বিজলি বিল মে ২০২৬")).toBeVisible();
    await expect(page.getByText("৳501")).toBeVisible();
  });

  test("TC-06-091 Expense form vendor selector fills vendor", async ({ page }) => {
    await gotoExpenses(page);
    await page.locator("select").nth(1).selectOption("vendor-1");
    await chooseCategory(page, "Supplies");
    await page.getByPlaceholder("0").fill("300");
    await page.getByPlaceholder("Brief note about this expense").fill("Vendor selected");
    await page.getByRole("button", { name: "Record Expense" }).click();
    await expect(page.getByText("Rahim Traders").first()).toBeVisible();
  });

  test("TC-06-092 Expense list pagination loads next page", async ({ page }) => {
    await gotoExpenses(page);
    await page.locator("button").filter({ hasText: "chevron_right" }).click();
    await expect(page.getByText("Expense 13")).toBeVisible();
    await expect(page.getByText("2 / 3")).toBeVisible();
  });

  test("TC-06-093 Expense list delete confirmation", async ({ page }) => {
    await gotoExpenses(page);
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Delete this expense?");
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Delete" }).first().click();
    await expect(page.getByText("Expense deleted.")).toBeVisible();
    await expect(page.getByText("Monthly rent")).toHaveCount(0);
  });

  test("TC-06-094 Expense list edit inline", async ({ page }) => {
    await gotoExpenses(page);
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.getByText("Edit Expense")).toBeVisible();
    await page.getByPlaceholder("0").fill("777");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Expense updated successfully.")).toBeVisible();
    await expect(page.getByText("৳777")).toBeVisible();
  });

  test("TC-06-095 Category management create new category", async ({ page }) => {
    await gotoExpenses(page);
    await page.getByLabel("New category name").fill("MARKETING");
    await page.getByLabel("New category Bangla name").fill("মার্কেটিং");
    await page.getByRole("button", { name: "Create Category" }).click();
    await page.getByPlaceholder("Select category").click();
    await expect(page.getByRole("button", { name: "মার্কেটিং" })).toBeVisible();
  });

  test("TC-06-096 Expense summary chart section displays category breakdown", async ({ page }) => {
    await gotoExpenses(page);
    await expect(page.getByText("Category Breakdown", { exact: true })).toBeVisible();
    await expect(page.getByText("Rent")).toBeVisible();
    await expect(page.getByText("Supplies")).toBeVisible();
    await expect(page.getByText("Transport")).toBeVisible();
  });

  test("TC-06-097 Recurring expense badge display", async ({ page }) => {
    await gotoExpenses(page);
    await expect(page.getByText("Recurring", { exact: true })).toBeVisible();
    await expect(page.getByText("FIXED", { exact: true })).toBeVisible();
  });
});
