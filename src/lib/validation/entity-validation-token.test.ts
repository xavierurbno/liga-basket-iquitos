import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createEntityValidationToken,
  isLegacyValidationUuid,
  verifyEntityValidationToken,
} from "./entity-validation-token";

const PLAYER_ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

describe("entity-validation-token", () => {
  const prevSecret = process.env.VALIDATION_TOKEN_SECRET;

  beforeEach(() => {
    process.env.VALIDATION_TOKEN_SECRET = "test-secret-phase1-min-32-chars!!";
  });

  afterEach(() => {
    if (prevSecret === undefined) {
      delete process.env.VALIDATION_TOKEN_SECRET;
    } else {
      process.env.VALIDATION_TOKEN_SECRET = prevSecret;
    }
  });

  it("crea y verifica token de jugador", () => {
    const token = createEntityValidationToken(PLAYER_ID, "player");
    const parsed = verifyEntityValidationToken(token);
    assert.deepEqual(parsed, { entityId: PLAYER_ID, kind: "player" });
  });

  it("rechaza firma alterada", () => {
    const token = createEntityValidationToken(PLAYER_ID, "player");
    const parts = token.split(".");
    const tampered = `${parts[0]}.${parts[1]}.invalidsig`;
    assert.equal(verifyEntityValidationToken(tampered), null);
  });

  it("detecta UUID legado", () => {
    assert.equal(isLegacyValidationUuid(PLAYER_ID), true);
    assert.equal(isLegacyValidationUuid("v1.abc.def"), false);
  });
});
