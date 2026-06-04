import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { logRateLimitBlocked, logSecurityEvent } from "./security-log";

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

  it("no lanza con tipos fase 1 (treasury, player, rate limit)", () => {
    assert.doesNotThrow(() => {
      logSecurityEvent(
        { type: "treasury.create", message: "ok", userId: "u1", meta: { treasuryId: "t1" } },
        { level: "info" },
      );
      logSecurityEvent(
        { type: "player.create", message: "ok", userId: "u1", clubId: "c1" },
        { level: "info" },
      );
      logRateLimitBlocked("login", "127.0.0.1", 60, "/login");
    });
  });
});
