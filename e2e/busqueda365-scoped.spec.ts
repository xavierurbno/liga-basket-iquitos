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

  test("al elegir categoría muestra plantilla o estado vacío (sin error RLS)", async ({
    page,
  }) => {
    const env = requireE2eEnv();
    test.skip(!env, "Define E2E_LEAGUE_SLUG y credenciales");

    await page.goto(`/l/${env!.leagueSlug}/busqueda-365/`);
    const select = page.getByTestId("busqueda365-category-select");
    await expect(select).toBeVisible({ timeout: 20_000 });

    const options = select.locator("option");
    const count = await options.count();
    test.skip(count < 2, "Se necesita al menos una categoría en la liga E2E");

    await select.selectOption({ index: 1 });
    await expect(page.getByTestId("busqueda365-roster")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/error de red|tenant|no autorizado/i)).not.toBeVisible();
  });
});
