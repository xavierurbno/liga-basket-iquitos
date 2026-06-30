import { test, expect } from "@playwright/test";
import { requireE2eEnv } from "./helpers/env";

test.describe("Intranet — aislamiento de club (delegado)", () => {
  test.beforeEach(async ({ page }) => {
    const env = requireE2eEnv();
    test.skip(!env, "Define variables E2E_* en .env.local o secretos CI");

    await page.goto("/login/");
    await page.getByTestId("login-email").fill(env!.email);
    await page.getByTestId("login-password").fill(env!.password);
    await page.getByTestId("login-submit").click();
    await page.waitForURL(/\/liga\/?/, { timeout: 30_000 });
  });

  test("no puede abrir categorías de un club ajeno", async ({ page }) => {
    const env = requireE2eEnv();
    test.skip(!env?.foreignClubId, "Define E2E_FOREIGN_CLUB_ID (UUID de otro club)");

    const res = await page.goto(`/liga/clubs/${env!.foreignClubId}/`);
    expect(res?.status()).toBe(404);
  });

  test("puede abrir categoría de su propio club (plantilla visible)", async ({ page }) => {
    const env = requireE2eEnv();
    test.skip(!env?.ownClubId, "Define E2E_OWN_CLUB_ID y E2E_OWN_CATEGORY_ID");

    const categoryId = process.env.E2E_OWN_CATEGORY_ID?.trim();
    test.skip(!categoryId, "Define E2E_OWN_CATEGORY_ID");

    const res = await page.goto(
      `/liga/clubs/${env!.ownClubId}/categories/${categoryId}/`,
    );
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 20_000 });
  });
});
