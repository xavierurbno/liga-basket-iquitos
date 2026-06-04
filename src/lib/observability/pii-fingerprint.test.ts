import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fingerprintDocument,
  fingerprintOpaqueToken,
  fingerprintSearchTerm,
} from "./pii-fingerprint.ts";

describe("pii-fingerprint", () => {
  it("fingerprintDocument expone últimos 4 dígitos y hash estable", () => {
    process.env.PII_LOG_HASH_SALT = "test-salt";

    const a = fingerprintDocument("12345678", "DNI");
    const b = fingerprintDocument("12345678", "DNI");

    assert.equal(a.docLast4, "5678");
    assert.equal(a.docHash, b.docHash);
    assert.equal(a.docHash.length, 16);
  });

  it("fingerprintDocument difiere por tipo de documento", () => {
    process.env.PII_LOG_HASH_SALT = "test-salt";

    const dni = fingerprintDocument("12345678", "DNI");
    const ce = fingerprintDocument("12345678", "CE");

    assert.notEqual(dni.docHash, ce.docHash);
  });

  it("fingerprintOpaqueToken marca UUID legacy y no expone token", () => {
    process.env.PII_LOG_HASH_SALT = "test-salt";

    const legacy = fingerprintOpaqueToken("550e8400-e29b-41d4-a716-446655440000");
    assert.equal(legacy.legacyUuid, true);

    const signed = fingerprintOpaqueToken("eyJhbGciOiJIUzI1NiJ9.payload.sig");
    assert.equal(signed.legacyUuid, false);
    assert.equal(signed.tokenHash.length, 16);
  });

  it("fingerprintSearchTerm registra longitud y hash sin texto plano", () => {
    process.env.PII_LOG_HASH_SALT = "test-salt";

    const fp = fingerprintSearchTerm("  García López  ");
    assert.equal(fp.termLen, 12);
    assert.equal(fp.termHash.length, 12);
  });
});
