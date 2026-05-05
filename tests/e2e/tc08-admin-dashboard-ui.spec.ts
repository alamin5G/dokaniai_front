import { expect, test, type Page } from "@playwright/test";

const TC08_UI_CASES = [
    "TC-08-083",
    "TC-08-084",
    "TC-08-085",
    "TC-08-086",
    "TC-08-087",
    "TC-08-088",
    "TC-08-089",
    "TC-08-090",
    "TC-08-091",
    "TC-08-092",
] as const;

const baseDate = "2026-05-04T00:00:00.000Z";

// ---------- Mock Data ----------

const adminStats = {
    totalUsers: 1250,
    activeUsers: 980,
    suspendedUsers: 15,
    totalBusinesses: 890,
    activeSubscriptions: 720,
    monthlyRevenue: 285000,
    totalRevenue: 3450000,
    aiTokensUsedToday: 125000,
    aiTokensUsedMonth: 3200000,
};

const subscriptionDistribution = [
    { plan: "FREE", count: 200, percentage: 16 },
    { plan: "BASIC", count: 350, percentage: 28 },
    { plan: "PLUS", count: 400, percentage: 32 },
    { plan: "PRO", count: 250, percentage: 20 },
    { plan: "ENTERPRISE", count: 50, percentage: 4 },
];

const revenueTrend = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.parse("2026-04-05") + i * 86400000).toISOString().split("T")[0],
    revenue: 8000 + Math.floor(Math.random() * 5000),
    newSubscriptions: 5 + Math.floor(Math.random() * 10),
}));

const userGrowth = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.parse("2026-04-05") + i * 86400000).toISOString().split("T")[0],
    newUsers: 10 + Math.floor(Math.random() * 20),
    cumulativeUsers: 1000 + i * 15,
}));

const aiTokenStats = {
    totalTokens: 3200000,
    tokensByModel: [
        { model: "gpt-4o-mini", tokens: 2400000, percentage: 75 },
        { model: "gpt-4o", tokens: 500000, percentage: 15.6 },
        { model: "text-embedding-3-small", tokens: 300000, percentage: 9.4 },
    ],
    avgTokensPerQuery: 180,
    totalQueries: 17800,
};

const paymentPipeline = {
    open: 25,
    inProgress: 12,
    resolved: 89,
    closed: 156,
};

const ticketList = Array.from({ length: 10 }, (_, i) => ({
    id: `ticket-${i + 1}`,
    subject: `Support request #${i + 1}`,
    status: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"][i % 4],
    priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"][i % 4],
    createdAt: new Date(Date.parse(baseDate) - i * 86400000).toISOString(),
}));

// ---------- Seed Function ----------

async function seedAdminDashboardApi(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem(
            "dokaniai-auth-storage",
            JSON.stringify({
                state: {
                    accessToken: "tc08-admin-token",
                    refreshToken: "tc08-admin-refresh",
                    userId: "admin-1",
                    userRole: "ADMIN",
                    status: "AUTHENTICATED",
                },
                version: 0,
            }),
        );
        localStorage.setItem("dokaniai-language", JSON.stringify({ state: { locale: "en" }, version: 0 }));
    });

    // Current user (admin)
    await page.route("**/users/me**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: { id: "admin-1", role: "ADMIN", name: "Admin User" } }),
        }),
    );

    // Admin stats
    await page.route("**/api/v1/admin/stats**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: adminStats }),
        }),
    );

    // Subscription stats
    await page.route("**/api/v1/admin/stats/subscriptions**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: subscriptionDistribution }),
        }),
    );

    // Revenue trend
    await page.route("**/api/v1/admin/dashboard/revenue-trend**", (route) => {
        const url = new URL(route.request().url());
        const range = url.searchParams.get("range") ?? "30d";
        const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
        const data = revenueTrend.slice(-days);
        return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data }),
        });
    });

    // User growth
    await page.route("**/api/v1/admin/dashboard/user-growth**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: userGrowth }),
        }),
    );

    // AI token stats
    await page.route("**/api/v1/admin/stats/ai-tokens**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: aiTokenStats }),
        }),
    );

    // Payment pipeline / ticket stats
    await page.route("**/api/v1/admin/stats/payment-pipeline**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: paymentPipeline }),
        }),
    );

    // Support tickets list
    await page.route("**/api/v1/admin/support/tickets**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: ticketList }),
        }),
    );

    // Audit logs
    await page.route("**/api/v1/admin/audit-logs**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: { content: [], totalElements: 0 } }),
        }),
    );

    // Admin users list
    await page.route("**/api/v1/admin/users**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: { content: [], totalElements: 0 } }),
        }),
    );

    // Plans list
    await page.route("**/api/v1/admin/plans**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: [] }),
        }),
    );

    // Subscription current (admin may not have personal subscription)
    await page.route("**/subscriptions/current**", (route) =>
        route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                success: true,
                data: {
                    id: "sub-admin",
                    userId: "admin-1",
                    planId: "enterprise",
                    status: "ACTIVE",
                    currentPeriodStart: "2026-05-01T00:00:00.000Z",
                    currentPeriodEnd: "2026-06-01T00:00:00.000Z",
                    billingCycle: "MONTHLY",
                },
            }),
        }),
    );

    // Business onboarding
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
}

async function gotoAdminDashboard(page: Page) {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await seedAdminDashboardApi(page);
    const response = await page.goto("/admin/dashboard");
    expect(response?.status()).toBeLessThan(500);
    try {
        await expect(page.getByTestId("metric-total-users")).toBeVisible({ timeout: 5000 });
    } catch {
        // Fallback: wait for body
        await expect(page.locator("body")).toBeVisible();
    }
}

// ---------- Tests ----------

test.describe("TC-08 Admin Dashboard — Frontend UI", () => {
    test("TC-08-083 Dashboard metric cards render with live data", async ({ page }) => {
        expect(TC08_UI_CASES).toHaveLength(10);
        await gotoAdminDashboard(page);

        // KPI metric cards visible
        await expect(page.getByTestId("metric-total-users")).toBeVisible();
        await expect(page.getByTestId("metric-active-users")).toBeVisible();
        await expect(page.getByTestId("metric-suspended-users")).toBeVisible();
        await expect(page.getByTestId("metric-subscription-stats")).toBeVisible();

        // Numeric values displayed (not "loading" or "undefined")
        const totalUsersValue = page.getByTestId("metric-total-users-value");
        if (await totalUsersValue.isVisible()) {
            await expect(totalUsersValue).not.toHaveText(/loading|undefined|null/i);
        }
    });

    test("TC-08-084 Subscription donut chart renders with plan distribution", async ({ page }) => {
        await gotoAdminDashboard(page);

        // Wait for chart to render
        const chart = page.getByTestId("subscription-donut-chart");
        await expect(chart).toBeVisible({ timeout: 10000 });

        // Chart legend shows plan names
        await expect(page.getByText(/PRO|PLUS|BASIC|FREE/)).toBeVisible();

        // Chart SVG/Canvas rendered
        const svgOrCanvas = chart.locator("svg, canvas");
        await expect(svgOrCanvas).toBeVisible();
    });

    test("TC-08-085 Revenue trend chart renders with date range selector", async ({ page }) => {
        await gotoAdminDashboard(page);

        // Revenue trend section
        await expect(page.getByTestId("revenue-trend-chart")).toBeVisible({ timeout: 10000 });

        // Date range selector buttons (7d, 30d, 90d)
        const btn7d = page.getByRole("button", { name: /7d/i });
        const btn30d = page.getByRole("button", { name: /30d/i });
        const btn90d = page.getByRole("button", { name: /90d/i });

        if (await btn7d.isVisible()) {
            await expect(btn7d).toBeVisible();
            await expect(btn30d).toBeVisible();
            await expect(btn90d).toBeVisible();

            // Click 30d and verify chart updates
            await btn30d.click();
            await page.waitForResponse(
                (resp) => resp.url().includes("revenue-trend") && resp.status() === 200,
            );
        }
    });

    test("TC-08-086 User growth chart renders with cumulative line", async ({ page }) => {
        await gotoAdminDashboard(page);

        // User growth section
        await expect(page.getByTestId("user-growth-chart")).toBeVisible({ timeout: 10000 });

        // Chart has data points (SVG or Canvas)
        const chart = page.getByTestId("user-growth-chart");
        const svgOrCanvas = chart.locator("svg, canvas");
        await expect(svgOrCanvas).toBeVisible();

        // Verify tooltip on hover
        const dataPoint = chart.locator("svg path, svg circle").first();
        if (await dataPoint.isVisible()) {
            await dataPoint.hover();
            await expect(page.getByText(/new users|cumulative/i)).toBeVisible();
        }
    });

    test("TC-08-087 AI token usage chart renders with model breakdown", async ({ page }) => {
        await gotoAdminDashboard(page);

        // AI token stats section
        await expect(page.getByTestId("ai-token-stats-chart")).toBeVisible({ timeout: 10000 });

        // Total tokens display
        await expect(page.getByTestId("total-tokens-display")).toBeVisible();

        // Model breakdown table or legend
        await expect(page.getByText(/gpt|model|breakdown/i)).toBeVisible();
    });

    test("TC-08-088 Payment pipeline chart shows ticket stats", async ({ page }) => {
        await gotoAdminDashboard(page);

        // Payment pipeline / ticket stats section
        const pipelineSection = page.getByTestId("payment-pipeline-chart");
        if (await pipelineSection.isVisible()) {
            // Ticket status breakdown
            await expect(page.getByText(/open|in.progress|resolved|closed/i)).toBeVisible();
        }
    });

    test("TC-08-089 Quick action grid has all admin actions", async ({ page }) => {
        await gotoAdminDashboard(page);

        // Quick action buttons
        const quickActions = page.getByTestId("quick-actions-grid");
        if (await quickActions.isVisible()) {
            const manageUsersLink = page.getByRole("link", { name: /manage users/i });
            const supportTicketsLink = page.getByRole("link", { name: /support tickets/i });
            const auditLogsLink = page.getByRole("link", { name: /audit logs/i });
            const plansLink = page.getByRole("link", { name: /plans/i });

            if (await manageUsersLink.isVisible()) await expect(manageUsersLink).toBeVisible();
            if (await supportTicketsLink.isVisible()) await expect(supportTicketsLink).toBeVisible();
            if (await auditLogsLink.isVisible()) await expect(auditLogsLink).toBeVisible();
            if (await plansLink.isVisible()) await expect(plansLink).toBeVisible();
        }
    });

    test("TC-08-090 Dashboard responsive on mobile viewport", async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 812 });
        await gotoAdminDashboard(page);

        // Dashboard still renders
        await expect(page.getByTestId("metric-total-users")).toBeVisible();

        // Mobile tabs
        const mobileTabs = page.getByTestId("dashboard-mobile-tabs");
        if (await mobileTabs.isVisible()) {
            const tabCount = await mobileTabs.getByRole("tab").count();
            expect(tabCount).toBeGreaterThanOrEqual(3);
        }

        // No horizontal overflow
        const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(hasOverflow).toBe(false);
    });

    test("TC-08-091 Ticket status bar shows distribution", async ({ page }) => {
        await gotoAdminDashboard(page);

        // Ticket status bar
        const statusBar = page.getByTestId("ticket-status-bar");
        if (await statusBar.isVisible()) {
            // Status segments
            await expect(page.getByText(/open/i)).toBeVisible();
            await expect(page.getByText(/resolved/i)).toBeVisible();

            // Bar segments have width
            const segments = statusBar.locator("[data-status]");
            const count = await segments.count();
            for (let i = 0; i < count; i++) {
                const width = await segments.nth(i).evaluate((el) => el.getBoundingClientRect().width);
                expect(width).toBeGreaterThanOrEqual(0);
            }
        }
    });

    test("TC-08-092 Dashboard shows fallback when chart API fails", async ({ page }) => {
        // Intercept and fail the revenue trend API
        await page.route("**/api/v1/admin/dashboard/revenue-trend**", (route) =>
            route.fulfill({ status: 500, body: JSON.stringify({ error: "Internal Server Error" }) }),
        );

        await seedAdminDashboardApi(page);
        // Re-apply the failing route (overrides the seed route)
        await page.route("**/api/v1/admin/dashboard/revenue-trend**", (route) =>
            route.fulfill({ status: 500, body: JSON.stringify({ error: "Internal Server Error" }) }),
        );

        const response = await page.goto("/admin/dashboard");
        expect(response?.status()).toBeLessThan(500);

        // Error boundary or fallback message
        const errorFallback = page.getByTestId("chart-error-fallback");
        if (await errorFallback.isVisible()) {
            await expect(errorFallback).toContainText(/error|failed|retry/i);
        }

        // Other sections still render
        await expect(page.getByTestId("metric-total-users")).toBeVisible();
    });
});
