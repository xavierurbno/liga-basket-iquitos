import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { extractValidationTokenFromUrl } from "./extract-validation-token";

describe("extractValidationTokenFromUrl", () => {
  const token = "v1.eyJ0ZXN0In0.signature";

  it("extrae token de URL absoluta", () => {
    assert.equal(
      extractValidationTokenFromUrl(`https://liga.test/validar/${encodeURIComponent(token)}`),
      token,
    );
  });

  it("acepta token crudo v1", () => {
    assert.equal(extractValidationTokenFromUrl(token), token);
  });

  it("devuelve null si falta segmento", () => {
    assert.equal(extractValidationTokenFromUrl("https://liga.test/validar/"), null);
  });
});
