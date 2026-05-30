import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertClubScopeForRead } from "./treasury-scope.ts";

describe("assertClubScopeForRead", () => {
  it("readonly no puede leer club fuera de su lista", () => {
    const access = { kind: "readonly" as const, clubIds: ["club-a"] };
    assert.deepEqual(assertClubScopeForRead(access, "club-b"), { clubIds: [] });
  });

  it("full con filtro devuelve un solo club", () => {
    const access = { kind: "full" as const, clubIds: null };
    assert.deepEqual(assertClubScopeForRead(access, "club-a"), { clubIds: ["club-a"] });
  });

  it("readonly permite club en su lista", () => {
    const access = { kind: "readonly" as const, clubIds: ["club-a", "club-b"] };
    assert.deepEqual(assertClubScopeForRead(access, "club-b"), { clubIds: ["club-b"] });
  });
});
