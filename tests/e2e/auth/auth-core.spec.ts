import { expect, test } from "@playwright/test";

const authPayload = {
  accessToken: "access-token-test",
  refreshToken: "refresh-token-test",
  userId: "user-auth-test",
  status: "SUCCESS",
};

async function clearBrowserState(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function stubPostLoginApis(page: import("@playwright/test").Page) {
  await page.route("**/users/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { id: "user-auth-test", role: "USER" } }),
    });
  });
  await page.route("**/subscriptions/current", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { status: "ACTIVE" } }),
    });
  });
  await page.route("**/businesses", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { businesses: [] } }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await clearBrowserState(page);
});

test("login requires identifier and password before calling API", async ({ page }) => {
  let loginCalls = 0;
  await page.route("**/auth/login", async (route) => {
    loginCalls += 1;
    await route.abort();
  });

  await page.goto("/login");
  await page.locator("form button[type='submit']").click();

  await expect.poll(() => loginCalls).toBe(0);
  await expect(page).toHaveURL(/\/login$/);
});

test("login posts credentials and persists auth tokens", async ({ page }) => {
  await stubPostLoginApis(page);
  let postedBody: Record<string, unknown> | null = null;
  await page.route("**/auth/login", async (route) => {
    postedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: authPayload }),
    });
  });

  await page.goto("/login");
  const inputs = page.locator("form input");
  await inputs.nth(0).fill("+8801712345678");
  await inputs.nth(1).fill("TestPassword123");
  await page.locator("form button[type='submit']").click();

  await expect.poll(() => postedBody?.phoneOrEmail).toBe("+8801712345678");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("dokaniai-auth-storage") ?? ""))
    .toContain("access-token-test");
});

test("login API failure keeps user on login page", async ({ page }) => {
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ success: false, error: { code: "BAD_REQUEST", message: "Invalid credentials" } }),
    });
  });

  await page.goto("/login");
  const inputs = page.locator("form input");
  await inputs.nth(0).fill("+8801712345678");
  await inputs.nth(1).fill("WrongPassword");
  await page.locator("form button[type='submit']").click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("form")).toContainText(/invalid|ভুল|সঠিক/i);
});

test("phone registration posts phone payload and redirects to OTP page", async ({ page }) => {
  let postedBody: Record<string, unknown> | null = null;
  await page.route("**/auth/register/phone", async (route) => {
    postedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { status: "OTP_SENT", userId: "user-auth-test" } }),
    });
  });

  await page.goto("/register");
  const inputs = page.locator("form input");
  await inputs.nth(0).fill("আল আমিন");
  await inputs.nth(1).fill("+8801712345678");
  await page.locator("input[type='checkbox']").check();
  await page.locator("form button[type='submit']").click();

  await expect.poll(() => postedBody?.phone).toBe("+8801712345678");
  await expect(page).toHaveURL(/\/verify-otp$/);
});

test("email registration posts email payload and redirects to email verification page", async ({ page }) => {
  let postedBody: Record<string, unknown> | null = null;
  await page.route("**/auth/register/email", async (route) => {
    postedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { status: "EMAIL_VERIFICATION_REQUIRED", userId: "user-auth-test" } }),
    });
  });

  await page.goto("/register");
  await page.getByRole("button").filter({ hasText: /email|ইমেইল/i }).click();
  const inputs = page.locator("form input");
  await inputs.nth(0).fill("Email User");
  await inputs.nth(1).fill("email-user@example.com");
  await inputs.nth(2).fill("+8801712345678");
  await inputs.nth(4).fill("TestPassword123");
  await page.locator("input[type='checkbox']").check();
  await page.locator("form button[type='submit']").click();

  await expect.poll(() => postedBody?.email).toBe("email-user@example.com");
  await expect(page).toHaveURL(/\/verify-email$/);
});

test("OTP verification requiring password setup redirects to set-password", async ({ page }) => {
  await page.route("**/auth/verify/phone", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { ...authPayload, status: "PASSWORD_SETUP_REQUIRED" },
      }),
    });
  });

  await page.goto("/verify-otp");
  await page.evaluate(() => {
    sessionStorage.setItem("dokaniai-auth-contact", "+8801712345678");
    sessionStorage.setItem("dokaniai-auth-method", "phone");
  });
  await page.reload();
  await page.locator("form input").first().fill("123456");
  await page.locator("form button[type='submit']").click();

  await expect(page).toHaveURL(/\/set-password$/, { timeout: 5_000 });
});

test("OTP verification for existing user redirects back to login", async ({ page }) => {
  await page.route("**/auth/verify/phone", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: authPayload }),
    });
  });

  await page.goto("/verify-otp");
  await page.evaluate(() => {
    sessionStorage.setItem("dokaniai-auth-contact", "+8801712345678");
    sessionStorage.setItem("dokaniai-auth-method", "phone");
  });
  await page.reload();
  await page.locator("form input").first().fill("123456");
  await page.locator("form button[type='submit']").click();

  await expect(page).toHaveURL(/\/login\?verified=true$/, { timeout: 5_000 });
});

test("set-password blocks mismatched confirmation before calling API", async ({ page }) => {
  let setPasswordCalls = 0;
  await page.route("**/auth/set-password", async (route) => {
    setPasswordCalls += 1;
    await route.abort();
  });

  await page.goto("/set-password");
  const inputs = page.locator("form input");
  await inputs.nth(0).fill("TestPassword123");
  await inputs.nth(1).fill("Different123");
  await page.locator("form button[type='submit']").click();

  await expect.poll(() => setPasswordCalls).toBe(0);
  await expect(page).toHaveURL(/\/set-password$/);
});
