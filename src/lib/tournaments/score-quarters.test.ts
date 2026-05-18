import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasAnyQuarterInput,
  sumSideQuarters,
  validateQuarterScores,
  formatQuarterLine,
} from "./score-quarters.ts";

describe("score-quarters", () => {
  it("suma cuartos y tiempo extra", () => {
    const total = sumSideQuarters(
      { homeQ1: 20, homeQ2: 18, homeQ3: 22, homeQ4: 15, homeOt: 5 },
      "home"
    );
    assert.equal(total, 80);
  });

  it("valida coincidencia con marcador", () => {
    const err = validateQuarterScores(80, 75, {
      homeQ1: 20,
      homeQ2: 20,
      homeQ3: 20,
      homeQ4: 20,
      awayQ1: 15,
      awayQ2: 15,
      awayQ3: 15,
      awayQ4: 30,
    });
    assert.equal(err, null);
  });

  it("ignora cuartos en cero (sin desglose)", () => {
    assert.equal(hasAnyQuarterInput({ homeQ1: 0, awayQ1: 0, homeQ2: 0 }), false);
    const err = validateQuarterScores(25, 15, { homeQ1: 0, awayQ1: 0, homeQ2: 0 });
    assert.equal(err, null);
  });

  it("rechaza desajuste de marcador", () => {
    const err = validateQuarterScores(90, 70, {
      homeQ1: 20,
      homeQ2: 20,
      homeQ3: 20,
      homeQ4: 20,
    });
    assert.ok(err?.includes("Local"));
  });

  it("formatea línea de cuartos", () => {
    const line = formatQuarterLine(
      { homeQ1: 10, homeQ2: 12, homeQ3: 8, homeQ4: 20 },
      "home"
    );
    assert.equal(line, "10 · 12 · 8 · 20");
  });
});
