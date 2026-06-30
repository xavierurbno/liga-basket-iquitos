import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  anonymizedDocumentHistorySnapshot,
  sanitizeDocumentHistorySnapshot,
} from "./document-history-snapshot.ts";

describe("document-history-snapshot", () => {
  it("sanitizeDocumentHistorySnapshot omite PII del jugador", () => {
    const out = sanitizeDocumentHistorySnapshot({
      type: "CONSTANCIA",
      entityId: "550e8400-e29b-41d4-a716-446655440000",
      shortIdentifier: "12345678",
      name: "Juan",
      lastname: "Pérez",
      documentNumber: "12345678",
      fotoPngDataUrl: "data:image/png;base64,abc",
      validationUrl: "https://example.com/validar/v1/token",
      clubName: "Club Test",
      leagueId: "liga-1",
      correlative: 42,
    });

    assert.equal(out.type, "CONSTANCIA");
    assert.equal(out.clubName, "Club Test");
    assert.equal(out.correlative, 42);
    assert.equal("name" in out, false);
    assert.equal("documentNumber" in out, false);
    assert.equal("validationUrl" in out, false);
    assert.equal("fotoPngDataUrl" in out, false);
  });

  it("anonymizedDocumentHistorySnapshot marca purga ARCO", () => {
    const out = anonymizedDocumentHistorySnapshot({
      type: "CARTA_PASE",
      clubName: "Club",
      name: "se elimina",
    });
    assert.equal(out.type, "CARTA_PASE");
    assert.equal(out.clubName, "Club");
    assert.equal("name" in out, false);
    assert.equal(typeof out._arcoAnonymizedAt, "string");
  });
});
