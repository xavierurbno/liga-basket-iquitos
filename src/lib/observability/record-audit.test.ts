import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AUDIT_ACTIONS, sanitizeAuditPayload } from "./record-audit";

describe("record-audit", () => {
  it("sanitizeAuditPayload omite PII y mantiene metadatos seguros", () => {
    const out = sanitizeAuditPayload({
      treasuryId: "550e8400-e29b-41d4-a716-446655440000",
      documentNumber: "12345678",
      tipo: "income",
      snapshot: { fullName: "Test" },
    });

    assert.ok(out);
    assert.equal(out.treasuryId, "550e8400-e29b-41d4-a716-446655440000");
    assert.equal(out.tipo, "income");
    assert.equal("documentNumber" in out, false);
    assert.equal("snapshot" in out, false);
  });

  it("sanitizeAuditPayload devuelve null si solo hay campos sensibles", () => {
    assert.equal(sanitizeAuditPayload({ document_number: "999" }), null);
  });

  it("expone constantes de acción Fase 2", () => {
    assert.equal(AUDIT_ACTIONS.treasuryCreate, "treasury.create");
    assert.equal(AUDIT_ACTIONS.documentEmit, "document.emit");
  });
});
