import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSignedValidationUrl } from "./is-signed-validation-url";

describe("isSignedValidationUrl", () => {
  it("acepta token v1", () => {
    assert.equal(
      isSignedValidationUrl("https://liga.test/validar/v1.eyJ0ZXN0In0.sig"),
      true,
    );
  });

  it("rechaza UUID legado", () => {
    assert.equal(
      isSignedValidationUrl(
        "https://liga.test/validar/a1b2c3d4-e5f6-4789-a012-3456789abcde",
      ),
      false,
    );
  });

  it("rechaza vacío", () => {
    assert.equal(isSignedValidationUrl(null), false);
  });
});
