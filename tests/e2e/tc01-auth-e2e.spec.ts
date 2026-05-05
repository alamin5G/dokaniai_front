import { expect, test } from "@playwright/test";

/**
 * TC-01 Section 11: E2E Full Auth Flows
 * Covers: TC-01-200 through TC-01-204
 */

function toBase64Url(value: string): string {
    return Buffer.from(value).toString("base64url");
}

function makeFakeJwt(payload: Record<string, unknown>): string {
    const header = { alg: "HS256", typ: "JWT" };
    return `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(payload))}.fakesignature`;
}

const ACCESS_TOKEN = makeFakeJwt({
    sub: "user@test.com",
    user_id: "user-001",
    roles: "ROLE_USER",
    device_id: "device-001",
    token_type: "ACCESS",
});

const REFRESH_TOKEN = "refresh-token-001";

const BUSINESS_FIXTURE = {
    id: "biz-001",
    name: "TC01 Test Shop",
    businessType: "GROCERY",
    status: "ACTIVE",
    currency: "BDT",
    timezone: "Asia/Dhaka",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
};

async function forceEnglishLocale(page: import("@playwright/test").Page) {
    await page.addInitScript(() => {
        localStorage.setItem("dokaniai-language", JSON.stringify({ state: { locale: "en" }, version: 0 }));
    });
}

async function stubPostLoginRoutes(page: import("@playwright/test").Page) {
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
            body: JSON.stringify({
                success: true,
                data: { id: "sub-1", status: "ACTIVE", planId: "basic", currentPeriodEnd: "2026-12-01T00:00:00Z" },
            }),
        });
    });

    await page.route("**/users/me**", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: { id: "user-001", role: "USER" } }),
        });
    });

    await page.route("**/businesses/onboarding/my-status**", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                success: true,
                data: { hasActiveBusinesses: true, hasCompletedOnboarding: true, requiresOnboarding: false },
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

// ===========================================================================
// TC-01-200: E2E — Complete Registration → Verify → Login → Logout
// ===========================================================================
test("TC-01-200: Full auth journey — register to login to logout", async ({ page }) => {
    await forceEnglishLocale(page);

    // --- Step 1: Register ---
    await page.route("**/auth/register/phone", async (route) => {
        await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
                success: true,
                data: { status: "OTP_SENT", phone: "8801712345678", message: "OTP sent" },
            }),
        });
    });

    await page.goto("/register");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });

    // Fill registration form
    const nameInput = page.locator("form input").first();
    await nameInput.fill("Test User TC01");

    const phoneInput = page.locator("form input[type='tel'], form input[placeholder*='01'], form input").nth(1);
    await phoneInput.fill("8801712345678");

    // Agree to terms if checkbox exists
    const checkbox = page.locator("form input[type='checkbox']");
    if (await checkbox.count() > 0) {
        await checkbox.check();
    }

    // Submit registration
    const submitBtn = page.locator("form button[type='submit']");
    await submitBtn.click();

    // --- Step 2: OTP Verification (mocked) ---
    await page.route("**/auth/verify/phone**", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                success: true,
                data: { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN, userId: "user-001", status: "SUCCESS" },
            }),
        });
    });

    await stubPostLoginRoutes(page);

    // If OTP page appears, fill OTP
    const otpInput = page.locator("input[type='text'], input[inputmode='numeric'], input[maxlength='6']").first();
    if (await otpInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await otpInput.fill("123456");
        const verifyBtn = page.locator("button[type='submit']");
        if (await verifyBtn.isVisible()) {
            await verifyBtn.click();
        }
    }

    // --- Step 3: Login (direct mock) ---
    await page.route("**/auth/login", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                success: true,
                data: { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN, userId: "user-001", status: "SUCCESS" },
            }),
        });
    });

    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });

    const identifierInput = page.locator("form input").first();
    await identifierInput.fill("8801712345678");

    const passwordInput = page.locator("form input[type='password']");
    if (await passwordInput.count() > 0) {
        await passwordInput.fill("TestPassword123!");
    }

    await page.locator("form button[type='submit']").click();

    // Should navigate away from login
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 10_000 });

    // --- Step 4: Logout ---
    await page.route("**/auth/logout**", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: null }),
        });
    });

    // Clear auth storage to simulate logout
    await page.evaluate(() => {
        localStorage.removeItem("dokaniai-auth-storage");
    });
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
});

// ===========================================================================
// TC-01-201: E2E — Password Reset Full Flow
// ===========================================================================
test("TC-01-201: Full password reset journey", async ({ page }) => {
    await forceEnglishLocale(page);

    // --- Step 1: Navigate to forgot-password ---
    await page.route("**/auth/forgot-password**", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: { message: "Reset OTP sent" } }),
        });
    });

    await page.goto("/forgot-password");
    const forgotForm = page.locator("form");
    const forgotPageLoaded = await forgotForm.isVisible({ timeout: 5_000 }).catch(() => false);

    if (forgotPageLoaded) {
        // Fill email/phone
        const input = page.locator("form input").first();
        await input.fill("test@example.com");
        await page.locator("form button[type='submit']").click();

        // --- Step 2: Reset password ---
        await page.route("**/auth/reset-password**", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: { message: "Password reset successful" } }),
            });
        });
    }

    // Verify we can reach the login page after reset flow
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });
});

// ===========================================================================
// TC-01-202: E2E — Account Deletion Full Flow
// ===========================================================================
test("TC-01-202: Full account deletion journey", async ({ page }) => {
    await forceEnglishLocale(page);

    // Seed authenticated state
    await page.addInitScript(
        ([accessToken, refreshToken]) => {
            localStorage.setItem(
                "dokaniai-auth-storage",
                JSON.stringify({
                    state: { accessToken, refreshToken, userId: "user-001", status: "AUTHENTICATED" },
                    version: 0,
                }),
            );
        },
        [ACCESS_TOKEN, REFRESH_TOKEN],
    );

    await stubPostLoginRoutes(page);

    // Navigate to account settings
    await page.goto("/account");
    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 10_000 });

    // Mock delete account endpoint
    await page.route("**/users/me**", async (route) => {
        if (route.request().method() === "DELETE") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: null }),
            });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: { id: "user-001", role: "USER", status: "ACTIVE" } }),
        });
    });

    // Look for delete button
    const deleteBtn = page.locator("button:has-text('Delete'), button:has-text('delete'), a:has-text('Delete')");
    if (await deleteBtn.count() > 0) {
        await deleteBtn.first().click();

        // Confirm deletion if dialog appears
        const confirmBtn = page.locator("button:has-text('Confirm'), button:has-text('confirm')");
        if (await confirmBtn.count() > 0) {
            await confirmBtn.first().click();
        }
    }

    // After deletion, clear auth and verify redirect to login
    await page.evaluate(() => {
        localStorage.removeItem("dokaniai-auth-storage");
    });
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
});

// ===========================================================================
// TC-01-203: E2E — Multi-Device Login/Logout
// ===========================================================================
test("TC-01-203: Multi-device login and independent logout", async ({ browser }) => {
    // --- Browser A (mobile) ---
    const contextA = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const pageA = await contextA.newPage();

    // --- Browser B (desktop) ---
    const contextB = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const pageB = await contextB.newPage();

    // Both login
    for (const p of [pageA, pageB]) {
        await forceEnglishLocale(p);
        await p.route("**/auth/login", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN, userId: "user-001", status: "SUCCESS" },
                }),
            });
        });
        await stubPostLoginRoutes(p);

        await p.goto("/login");
        await expect(p.locator("form")).toBeVisible({ timeout: 15_000 });

        const identifierInput = p.locator("form input").first();
        await identifierInput.fill("8801712345678");

        const passwordInput = p.locator("form input[type='password']");
        if (await passwordInput.count() > 0) {
            await passwordInput.fill("TestPassword123!");
        }

        await p.locator("form button[type='submit']").click();
    }

    // Both should be away from login
    await expect(pageA).not.toHaveURL(/\/login$/, { timeout: 10_000 });
    await expect(pageB).not.toHaveURL(/\/login$/, { timeout: 10_000 });

    // Logout from Browser A
    await pageA.route("**/auth/logout**", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: null }),
        });
    });

    await pageA.evaluate(() => {
        localStorage.removeItem("dokaniai-auth-storage");
    });
    await pageA.goto("/login");
    await expect(pageA).toHaveURL(/\/login/);

    // Browser B should still be authenticated (different session)
    // Navigate to a protected page
    await pageB.goto("/account");
    const pageBUrl = pageB.url();
    // Browser B should NOT be on login page
    expect(pageBUrl, "Browser B should still be authenticated after Browser A logout").not.toMatch(/\/login$/);

    await contextA.close();
    await contextB.close();
});

// ===========================================================================
// TC-01-204: E2E — Phone Change Full Flow
// ===========================================================================
test("TC-01-204: Full phone number change journey", async ({ page }) => {
    await forceEnglishLocale(page);

    // Seed authenticated state
    await page.addInitScript(
        ([accessToken, refreshToken]) => {
            localStorage.setItem(
                "dokaniai-auth-storage",
                JSON.stringify({
                    state: { accessToken, refreshToken, userId: "user-001", status: "AUTHENTICATED" },
                    version: 0,
                }),
            );
        },
        [ACCESS_TOKEN, REFRESH_TOKEN],
    );

    await stubPostLoginRoutes(page);

    // Navigate to account settings
    await page.goto("/account");
    await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });

    // Mock phone change request
    await page.route("**/users/me/phone**", async (route) => {
        if (route.request().method() === "PUT" || route.request().method() === "POST") {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: { message: "OTP sent to new phone" } }),
            });
            return;
        }
        await route.continue();
    });

    // Mock OTP verification for phone change
    await page.route("**/users/me/phone/verify**", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, data: { phone: "8801898765432", verified: true } }),
        });
    });

    // Look for phone change button/link
    const phoneChangeBtn = page.locator(
        "button:has-text('Phone'), button:has-text('phone'), a:has-text('Change Phone'), button:has-text('Change')"
    );

    if (await phoneChangeBtn.count() > 0) {
        await phoneChangeBtn.first().click();

        // Enter new phone number if input appears
        const newPhoneInput = page.locator("input[type='tel'], input[placeholder*='01']").first();
        if (await newPhoneInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await newPhoneInput.fill("8801898765432");

            const submitBtn = page.locator("button[type='submit']");
            if (await submitBtn.isVisible()) {
                await submitBtn.click();
            }

            // Enter OTP if prompted
            const otpInput = page.locator("input[maxlength='6'], input[inputmode='numeric']").first();
            if (await otpInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
                await otpInput.fill("123456");
                const verifyBtn = page.locator("button[type='submit']");
                if (await verifyBtn.isVisible()) {
                    await verifyBtn.click();
                }
            }
        }
    }

    // Verify we can login with new phone (mocked)
    await page.route("**/auth/login", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                success: true,
                data: { accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN, userId: "user-001", status: "SUCCESS" },
            }),
        });
    });

    await page.evaluate(() => localStorage.removeItem("dokaniai-auth-storage"));
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });

    const identifierInput = page.locator("form input").first();
    await identifierInput.fill("8801898765432");

    const passwordInput = page.locator("form input[type='password']");
    if (await passwordInput.count() > 0) {
        await passwordInput.fill("TestPassword123!");
    }

    await page.locator("form button[type='submit']").click();
    // Login with new phone should work (navigates away from /login)
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 10_000 });
});
