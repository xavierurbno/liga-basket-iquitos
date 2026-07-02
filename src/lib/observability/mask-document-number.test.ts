import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { maskDocumentNumber } from "./mask-document-number";

describe("maskDocumentNumber", () => {
  it("enmascara dejando últimos 3 dígitos", () => {
    assert.equal(maskDocumentNumber("12345678"), "***678");
  });

  it("maneja vacío", () => {
    assert.equal(maskDocumentNumber(""), "—");
  });

  it("maneja null y documentos cortos", () => {
    assert.equal(maskDocumentNumber(null), "—");
    assert.equal(maskDocumentNumber("12"), "***12");
    assert.equal(maskDocumentNumber("123"), "***123");
  });
});
