import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveDocumentValidationUrl } from "./resolve-document-validation-url";

const SIGNED_URL =
  "https://liga.test/validar/v1.eyJ0ZXN0In0.signature";

describe("resolveDocumentValidationUrl", () => {
  it("carta de pase exige URL firmada", () => {
    const missing = resolveDocumentValidationUrl({
      type: "CARTA_PASE",
      validationUrl: null,
    });
    assert.equal(missing.ok, false);

    const ok = resolveDocumentValidationUrl({
      type: "CARTA_PASE",
      validationUrl: SIGNED_URL,
    });
    assert.equal(ok.ok, true);
    if (ok.ok && "url" in ok && ok.url) {
      assert.equal(ok.url, SIGNED_URL);
    }
  });

  it("constancia exige URL firmada", () => {
    const missing = resolveDocumentValidationUrl({
      type: "CONSTANCIA",
      validationUrl: "",
    });
    assert.equal(missing.ok, false);
  });

  it("solvencia club omite QR si no hay URL", () => {
    const res = resolveDocumentValidationUrl({
      type: "SOLVENCIA_CLUB",
      validationUrl: null,
    });
    assert.equal(res.ok, true);
    if (res.ok && "skipQr" in res) {
      assert.equal(res.skipQr, true);
      assert.equal(res.url, null);
    }
  });

  it("rechaza URL legacy con UUID en carta de pase", () => {
    const res = resolveDocumentValidationUrl({
      type: "CARTA_PASE",
      validationUrl:
        "https://liga.test/validar/a1b2c3d4-e5f6-4789-a012-3456789abcde",
    });
    assert.equal(res.ok, false);
  });
});
