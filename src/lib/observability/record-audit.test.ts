import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AUDIT_ACTIONS, sanitizeAuditPayload } from "./audit-payload-sanitizer.ts";

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
    assert.equal(sanitizeAuditPayload({ full_name: "Juan Pérez" }), null);
    assert.equal(sanitizeAuditPayload({ note: "12345678" }), null);
  });

  it("sanitizeAuditPayload omite nombres y fechas de nacimiento", () => {
    const out = sanitizeAuditPayload({
      playerId: "p-1",
      firstname: "Ana",
      lastname: "García",
      birthdate: "2010-05-01",
    });
    assert.ok(out);
    assert.equal(out.playerId, "p-1");
    assert.equal("firstname" in out, false);
    assert.equal("lastname" in out, false);
    assert.equal("birthdate" in out, false);
  });

  it("expone constantes de acción Fase 2", () => {
    assert.equal(AUDIT_ACTIONS.treasuryCreate, "treasury.create");
    assert.equal(AUDIT_ACTIONS.documentEmit, "document.emit");
    assert.equal(AUDIT_ACTIONS.carnetEmit, "carnet.emit");
    assert.equal(AUDIT_ACTIONS.playerUpdate, "player.update");
    assert.equal(AUDIT_ACTIONS.playerDelete, "player.delete");
  });
});
