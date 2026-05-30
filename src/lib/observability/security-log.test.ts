import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { logSecurityEvent } from "./security-log";

describe("security-log", () => {
  it("no lanza al registrar evento estructurado", () => {
    assert.doesNotThrow(() =>
      logSecurityEvent({
        type: "auth.tenant.club_mismatch",
        message: "test",
        userId: "user-1",
        role: "CLUB_DELEGATE",
        clubId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        attemptedClubId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      }),
    );
  });
});
