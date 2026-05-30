import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidUuid } from "../db/public-read-guards";
import { busqueda365CategoriesCacheTag } from "./busqueda365-cache";

const LEAGUE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("busqueda365 league scope", () => {
  it("rechaza leagueId que no es UUID", () => {
    assert.equal(isValidUuid("liga-iquitos"), false);
    assert.equal(isValidUuid(""), false);
  });

  it("acepta UUID de liga para cache tag por tenant", () => {
    assert.equal(isValidUuid(LEAGUE_ID), true);
    assert.equal(
      busqueda365CategoriesCacheTag(LEAGUE_ID),
      `categories-list-${LEAGUE_ID}`,
    );
  });
});
