import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertActorMayAssignRole } from "./assignable-roles";

describe("assignable-roles", () => {
  it("bloquea SUPER_ADMIN para no super admins", () => {
    assert.equal(
      assertActorMayAssignRole("LEAGUE_ADMIN", "SUPER_ADMIN"),
      "Solo un super administrador puede asignar el rol SUPER_ADMIN."
    );
    assert.equal(assertActorMayAssignRole("SUPER_ADMIN", "SUPER_ADMIN"), null);
    assert.equal(assertActorMayAssignRole("LEAGUE_ADMIN", "CLUB_DELEGATE"), null);
  });
});
