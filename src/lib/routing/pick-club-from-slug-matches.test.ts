import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickClubFromSlugMatches } from "./pick-club-from-slug-matches";

describe("pickClubFromSlugMatches", () => {
  it("devuelve null sin coincidencias", () => {
    assert.equal(pickClubFromSlugMatches("real", []), null);
  });

  it("devuelve el único club", () => {
    const club = { id: "a", slug: "real" };
    assert.deepEqual(pickClubFromSlugMatches("real", [club]), club);
  });

  it("devuelve null si hay más de un club con el mismo slug", () => {
    const a = { id: "a" };
    const b = { id: "b" };
    assert.equal(pickClubFromSlugMatches("real", [a, b]), null);
  });
});
