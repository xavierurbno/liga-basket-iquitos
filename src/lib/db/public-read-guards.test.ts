import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidUuid, sanitizeTsQueryInput } from "./public-read-guards.ts";

describe("public-read-guards", () => {
  it("valida UUID v4", () => {
    assert.equal(isValidUuid("550e8400-e29b-41d4-a716-446655440000"), true);
    assert.equal(isValidUuid("not-a-uuid"), false);
    assert.equal(isValidUuid(""), false);
  });

  it("sanitiza términos para tsquery", () => {
    assert.equal(sanitizeTsQueryInput("  "), "");
    assert.equal(sanitizeTsQueryInput("a"), "");
    assert.equal(sanitizeTsQueryInput("juan & | !"), "juan:*");
    assert.equal(sanitizeTsQueryInput("pérez 12"), "pérez:* & 12:*");
  });
});
