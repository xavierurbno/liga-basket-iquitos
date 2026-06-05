import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolvePlayerValidationStatus } from "./player-validation-status";

describe("resolvePlayerValidationStatus", () => {
  it("mapea ACTIVO a HABILITADO", () => {
    const r = resolvePlayerValidationStatus("ACTIVO");
    assert.equal(r.label, "HABILITADO");
    assert.equal(r.tone, "habilitado");
  });

  it("mapea SUSPENDIDO", () => {
    const r = resolvePlayerValidationStatus("SUSPENDIDO");
    assert.equal(r.label, "SUSPENDIDO");
    assert.equal(r.tone, "suspendido");
  });

  it("mapea PENDIENTE_PAGO e INACTIVO a NO HABILITADO", () => {
    assert.equal(resolvePlayerValidationStatus("PENDIENTE_PAGO").label, "NO HABILITADO");
    assert.equal(resolvePlayerValidationStatus("INACTIVO").label, "NO HABILITADO");
  });

  it("estado desconocido cae en NO HABILITADO", () => {
    const r = resolvePlayerValidationStatus(undefined);
    assert.equal(r.label, "NO HABILITADO");
    assert.equal(r.tone, "no_habilitado");
  });
});
