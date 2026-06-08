import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AUTH_ERRORS } from "./auth-errors";
import { checkDelegateClubScope } from "./delegate-club-scope";
import type { AuthContext } from "./withAuth";

const CLUB_A = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const CLUB_B = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

describe("checkDelegateClubScope", () => {
  it("permite FormData con el club asignado", () => {
    const context: AuthContext = {
      userId: "user-1",
      role: "CLUB_DELEGATE",
      clubId: CLUB_A,
    };
    const fd = new FormData();
    fd.set("clubId", CLUB_A);
    assert.equal(checkDelegateClubScope(context, [fd]), null);
  });

  it("bloquea FormData con club ajeno", () => {
    const context: AuthContext = {
      userId: "user-1",
      role: "CLUB_DELEGATE",
      clubId: CLUB_A,
    };
    const fd = new FormData();
    fd.set("clubId", CLUB_B);
    assert.equal(checkDelegateClubScope(context, [fd]), AUTH_ERRORS.unauthorizedClub);
  });

  it("bloquea delegado sin club_id en JWT", () => {
    const context: AuthContext = {
      userId: "user-1",
      role: "CLUB_DELEGATE",
    };
    const fd = new FormData();
    fd.set("clubId", CLUB_A);
    const err = checkDelegateClubScope(context, [fd]);
    assert.ok(err);
    assert.match(err!, /club asignado/i);
  });

  it("ignora roles que no son delegado", () => {
    const context: AuthContext = {
      userId: "admin-1",
      role: "LEAGUE_ADMIN",
      leagueId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    };
    const fd = new FormData();
    fd.set("clubId", CLUB_B);
    assert.equal(checkDelegateClubScope(context, [fd]), null);
  });
});
