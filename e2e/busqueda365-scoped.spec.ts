import { test, expect } from "@playwright/test";
import { requireE2eEnv } from "./helpers/env";

test.describe("Búsqueda 365 — alcance por liga", () => {
  test("carga categorías en la ruta de liga y no muestra error de tenant", async ({
    page,
  }) => {
    const env = requireE2eEnv();
    test.skip(!env, "Define E2E_LEAGUE_SLUG y credenciales de delegado o staff");

    await page.goto(`/l/${env!.leagueSlug}/busqueda-365/`);
    await expect(page.getByTestId("busqueda365-root")).toBeVisible();

    const select = page.getByTestId("busqueda365-category-select");
    await expect(select).toBeVisible({ timeout: 20_000 });

    const optionCount = await select.locator("option").count();
    expect(optionCount).toBeGreaterThan(0);

    await expect(page.getByText(/leagueId|tenant|no autorizado/i)).not.toBeVisible();
  });
});
