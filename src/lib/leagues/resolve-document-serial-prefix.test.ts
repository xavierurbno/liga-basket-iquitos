import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatDocumentSerialText,
  resolveDocumentSerialPrefix,
} from "./resolve-document-serial-prefix";

describe("resolveDocumentSerialPrefix", () => {
  it("usa prefijo personalizado si está definido", () => {
    assert.equal(
      resolveDocumentSerialPrefix({
        slug: "copa-power-kids",
        documentSerialPrefix: "COPA",
      }),
      "COPA",
    );
  });

  it("LDDBI para slug primario iquitos", () => {
    assert.equal(
      resolveDocumentSerialPrefix({ slug: "iquitos", name: "LDDBI" }),
      "LDDBI",
    );
  });

  it("deriva prefijo del slug en torneos locales", () => {
    const prefix = resolveDocumentSerialPrefix({
      slug: "copa-power-kids",
      name: "Copa Power Kids",
    });
    assert.ok(prefix.length >= 3);
    assert.notEqual(prefix, "LDDBI");
  });
});

describe("formatDocumentSerialText", () => {
  it("formatea serial con copia", () => {
    assert.equal(formatDocumentSerialText("COPA", "12345678", 5, true), "COPA - 12345678 - C5");
  });

  it("formatea serial sin copia", () => {
    assert.equal(formatDocumentSerialText("LDDBI", "87654321", 12, false), "LDDBI - 87654321 - 12");
  });
});
