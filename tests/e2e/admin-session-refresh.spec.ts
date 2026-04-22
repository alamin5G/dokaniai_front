import { expect, test } from "@playwright/test";

function toBase64Url(value: string): string {
	return Buffer.from(value).toString("base64url");
}

function makeFakeJwt(payload: Record<string, unknown>): string {
	const header = { alg: "HS256", typ: "JWT" };
	return `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}.signature`;
}

const OLD_ACCESS_TOKEN = makeFakeJwt({
	sub: "admin@example.com",
	user_id: "admin-1",
	roles: "ROLE_SUPER_ADMIN",
	device_id: "device-1",
	token_type: "ACCESS",
});

const NEW_ACCESS_TOKEN = makeFakeJwt({
	sub: "admin@example.com",
	user_id: "admin-1",
	roles: "ROLE_SUPER_ADMIN",
	device_id: "device-1",
	token_type: "ACCESS",
	jti: "new-access-jti",
});

const OLD_REFRESH_TOKEN = "refresh-token-old";
const NEW_REFRESH_TOKEN = "refresh-token-new";

const SUMMARY_FIXTURE = {
	totalCompleted: 12,
	totalManualReview: 2,
	totalFailed: 1,
	totalFraudFlags: 0,
	totalRejected: 1,
	autoVerifiedRate: 84,
	todayCompleted: 3,
	todayRevenue: 1490,
};

const SETTINGS_FIXTURE = {
	bkash: "01700000000",
	nagad: "01800000000",
	rocket: "01900000000",
};

function seedAdminAuthWithoutRole(page: import("@playwright/test").Page) {
	return page.addInitScript(
		([seedAccessToken, seedRefreshToken]) => {
			localStorage.setItem(
				"dokaniai-auth-storage",
				JSON.stringify({
					state: {
						accessToken: seedAccessToken,
						refreshToken: seedRefreshToken,
						userId: "admin-1",
						userRole: null,
						status: "AUTHENTICATED",
					},
					version: 0,
				}),
			);

			localStorage.setItem(
				"dokaniai-language",
				JSON.stringify({ state: { locale: "en" }, version: 0 }),
			);
		},
		[OLD_ACCESS_TOKEN, OLD_REFRESH_TOKEN] as const,
	);
}

test("admin expired session refreshes once under parallel 401s and stays on admin", async ({ page }) => {
	await seedAdminAuthWithoutRole(page);

	let refreshCount = 0;
	const seenOldTokenUrls = new Set<string>();

	await page.route("**/api/v1/auth/refresh", async (route) => {
		refreshCount += 1;
		await new Promise((resolve) => setTimeout(resolve, 150));
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				data: {
					accessToken: NEW_ACCESS_TOKEN,
					refreshToken: NEW_REFRESH_TOKEN,
				},
			}),
		});
	});

	await page.route("**/api/v1/payments/admin/**", async (route) => {
		const auth = route.request().headers()["authorization"] ?? "";
		const url = route.request().url();

		if (auth === `Bearer ${OLD_ACCESS_TOKEN}`) {
			seenOldTokenUrls.add(url);
			await route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({ success: false, error: { code: "JWT_EXPIRED", message: "expired" } }),
			});
			return;
		}

		if (auth !== `Bearer ${NEW_ACCESS_TOKEN}`) {
			await route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "missing token" } }),
			});
			return;
		}

		if (url.endsWith("/manual-review") || url.endsWith("/fraud-flags") || url.endsWith("/rejected") || url.endsWith("/completed")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, data: [] }),
			});
			return;
		}

		if (url.endsWith("/devices") || url.endsWith("/sms-pool") || url.endsWith("/mfs-numbers/pending")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, data: [] }),
			});
			return;
		}

		if (url.endsWith("/summary")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, data: SUMMARY_FIXTURE }),
			});
			return;
		}

		if (url.endsWith("/settings")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, data: SETTINGS_FIXTURE }),
			});
			return;
		}

		await route.fulfill({
			status: 404,
			contentType: "application/json",
			body: JSON.stringify({ success: false, error: { code: "NOT_FOUND", message: url } }),
		});
	});

	await page.goto("/admin/payments");

	await expect(page).toHaveURL(/\/admin\/payments$/);
	await expect(page.getByText("DokaniAI Admin")).toBeVisible();
	await expect(page.getByText("84%")).toBeVisible();

	await expect.poll(() => refreshCount).toBe(1);
	await expect.poll(() => seenOldTokenUrls.size).toBeGreaterThan(1);

	const storedRole = await page.evaluate(() => {
		const raw = localStorage.getItem("dokaniai-auth-storage");
		if (!raw) return null;
		return JSON.parse(raw)?.state?.userRole ?? null;
	});

	expect(storedRole).toBe("SUPER_ADMIN");
});
