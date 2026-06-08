import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { maskDocumentNumber } from "./mask-document-number";

describe("maskDocumentNumber", () => {
  it("enmascara dejando últimos 4 dígitos", () => {
    assert.equal(maskDocumentNumber("12345678"), "****5678");
  });

  it("maneja vacío", () => {
    assert.equal(maskDocumentNumber(""), "—");
  });
});
