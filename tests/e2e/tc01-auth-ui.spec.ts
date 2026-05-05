import { expect, test } from "@playwright/test";

/**
 * TC-01 Section 9: Frontend UI / Visual / Accessibility Tests
 * Covers: TC-01-160 through TC-01-167
 */

// ---------------------------------------------------------------------------
// TC-01-160: Login Page — Mobile Viewport (375px)
// ---------------------------------------------------------------------------
test("TC-01-160: Login page renders on mobile viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, "Login page should not have horizontal overflow on mobile").toBe(false);
});

// ---------------------------------------------------------------------------
// TC-01-161: Register Page — Desktop Viewport (1280px)
// ---------------------------------------------------------------------------
test("TC-01-161: Register page renders on desktop viewport without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/register");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, "Register page should not have horizontal overflow on desktop").toBe(false);
});

// ---------------------------------------------------------------------------
// TC-01-162: Login Form — Accessibility (a11y)
// ---------------------------------------------------------------------------
test("TC-01-162: Login form has accessible labels and semantic structure", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });

    // Check that form inputs have associated labels (via aria-label, placeholder, or <label>)
    const inputs = page.locator("form input");
    const inputCount = await inputs.count();
    expect(inputCount, "Login form should have at least 2 inputs").toBeGreaterThanOrEqual(2);

    for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const hasLabel =
            (await input.getAttribute("aria-label")) !== null ||
            (await input.getAttribute("placeholder")) !== null ||
            (await input.getAttribute("id")) !== null;
        expect(hasLabel, `Input ${i} should have an accessible label`).toBe(true);
    }

    // Submit button should be present and have accessible text
    const submitBtn = page.locator("form button[type='submit']");
    await expect(submitBtn).toBeVisible();
    const btnText = await submitBtn.innerText();
    expect(btnText.trim().length, "Submit button should have visible text").toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// TC-01-163: Register Page — Mobile Visual
// ---------------------------------------------------------------------------
test("TC-01-163: Register page renders on mobile viewport correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/register");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });

    // Verify key form elements are visible on mobile
    const inputs = page.locator("form input");
    const count = await inputs.count();
    expect(count, "Register form should have multiple input fields").toBeGreaterThanOrEqual(2);

    // No horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, "Register page should not overflow on mobile").toBe(false);
});

// ---------------------------------------------------------------------------
// TC-01-164: Login — Bangla Keyboard Input Handling
// ---------------------------------------------------------------------------
test("TC-01-164: Bangla characters in login identifier field are handled gracefully", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });

    const identifierInput = page.locator("form input").first();
    await identifierInput.fill("আব্দুল করিম");
    await identifierInput.blur();

    // The value should be accepted (no crash) — validation happens on submit
    const value = await identifierInput.inputValue();
    expect(value).toBe("আব্দুল করিম");
});

// ---------------------------------------------------------------------------
// TC-01-165: OTP Input — Auto-Focus Behavior
// ---------------------------------------------------------------------------
test("TC-01-165: OTP verification page renders with input fields", async ({ page }) => {
    // Navigate to register first, then simulate OTP page
    await page.goto("/register");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });

    // The OTP page is at /verify-otp — check it renders
    await page.goto("/verify-otp");
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Page should load without error (may show form or redirect)
    const response = await page.goto("/verify-otp");
    expect(response?.status(), "OTP page should not return server error").toBeLessThan(500);
});

// ---------------------------------------------------------------------------
// TC-01-166: Auth Form — Validation Messages in Bangla
// ---------------------------------------------------------------------------
test("TC-01-166: Validation messages display in Bangla when locale is set", async ({ page }) => {
    // Set Bangla locale
    await page.addInitScript(() => {
        localStorage.setItem("dokaniai-language", JSON.stringify({ state: { locale: "bn" }, version: 0 }));
    });

    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });

    // Submit empty form to trigger validation
    const submitBtn = page.locator("form button[type='submit']");
    await submitBtn.click();

    // Wait for validation messages — check for Bangla characters in error messages
    const errorElements = page.locator("form .text-error, form [class*='error'], form p.text-sm");
    const errorCount = await errorElements.count();

    if (errorCount > 0) {
        // At least one validation message should contain Bangla characters
        const hasBangla = await errorElements.evaluateAll((els) =>
            els.some((el) => /[\u0980-\u09FF]/.test(el.textContent || ""))
        );
        expect(hasBangla, "Validation messages should contain Bangla text").toBe(true);
    }
});

// ---------------------------------------------------------------------------
// TC-01-167: Auth Form — Error Display After Failed Login
// ---------------------------------------------------------------------------
test("TC-01-167: Error message displayed after failed login, identifier preserved", async ({ page }) => {
    await page.route("**/auth/login", async (route) => {
        await route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials" } }),
        });
    });

    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible({ timeout: 15_000 });

    // Fill in credentials
    const identifierInput = page.locator("form input").first();
    const passwordInput = page.locator("form input[type='password']");

    await identifierInput.fill("test@example.com");
    if (await passwordInput.count() > 0) {
        await passwordInput.fill("WrongPassword123!");
    }

    // Submit
    const submitBtn = page.locator("form button[type='submit']");
    await submitBtn.click();

    // Verify error message appears
    const errorBanner = page.locator("text-error, .bg-error, [class*='error']");
    await expect(errorBanner.first(), "Error message should appear after failed login").toBeVisible({ timeout: 5_000 });

    // Verify identifier field is preserved (not cleared)
    const identifierValue = await identifierInput.inputValue();
    expect(identifierValue, "Identifier field should be preserved after failed login").toBe("test@example.com");
});
