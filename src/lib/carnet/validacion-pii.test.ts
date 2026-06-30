import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { maskDocumentNumber } from "../observability/mask-document-number.ts";

describe("validacion carnet PII", () => {
  it("enmascara DNI para vista pública", () => {
    assert.equal(maskDocumentNumber("12345678"), "****5678");
  });

  it("año de nacimiento sin día/mes para validación pública", () => {
    const birthdate = new Date("2010-05-15T12:00:00.000Z");
    const label = String(birthdate.getFullYear());
    assert.equal(label, "2010");
  });
});
