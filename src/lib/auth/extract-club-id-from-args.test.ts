import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractClubIdFromActionArgs } from "./extract-club-id-from-args.ts";

describe("extract-club-id-from-args", () => {
  it("extrae clubId de FormData", () => {
    const fd = new FormData();
    fd.set("clubId", "550e8400-e29b-41d4-a716-446655440000");
    assert.equal(
      extractClubIdFromActionArgs([fd]),
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("extrae clubId de objeto tipado", () => {
    assert.equal(
      extractClubIdFromActionArgs([
        { clubId: "550e8400-e29b-41d4-a716-446655440000", concept: "Cuota" },
      ]),
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("devuelve undefined si no hay clubId", () => {
    assert.equal(extractClubIdFromActionArgs(["texto"]), undefined);
  });
});
