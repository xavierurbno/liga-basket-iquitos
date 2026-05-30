import { test, expect } from "@playwright/test";
import { requireE2eEnv } from "./helpers/env";

test.describe("Login intranet", () => {
  test("delegado puede iniciar sesión y llegar a /liga/", async ({ page }) => {
    const env = requireE2eEnv();
    test.skip(!env, "Define E2E_DELEGATE_EMAIL, E2E_DELEGATE_PASSWORD y E2E_LEAGUE_SLUG");

    await page.goto("/login/");
    await page.getByTestId("login-email").fill(env!.email);
    await page.getByTestId("login-password").fill(env!.password);
    await page.getByTestId("login-submit").click();

    await page.waitForURL(/\/liga\/?/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/liga\/?/);
  });
});
