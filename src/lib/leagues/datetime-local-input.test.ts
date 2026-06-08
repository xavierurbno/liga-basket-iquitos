import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseDatetimeLocalInput,
  toDatetimeLocalInputValue,
} from "./datetime-local-input.ts";

describe("datetime-local-input (America/Lima)", () => {
  it("parsea hora de pared peruana como instante UTC correcto", () => {
    const parsed = parseDatetimeLocalInput("2026-06-08T17:30");
    assert.equal(parsed?.toISOString(), "2026-06-08T22:30:00.000Z");
  });

  it("formatea instante UTC a hora Lima para el input", () => {
    const formatted = toDatetimeLocalInputValue("2026-06-08T22:30:00.000Z");
    assert.equal(formatted, "2026-06-08T17:30");
  });

  it("conserva la hora tras ida y vuelta", () => {
    const wall = "2026-06-08T17:35";
    const roundTrip = toDatetimeLocalInputValue(parseDatetimeLocalInput(wall)!);
    assert.equal(roundTrip, wall);
  });
});
