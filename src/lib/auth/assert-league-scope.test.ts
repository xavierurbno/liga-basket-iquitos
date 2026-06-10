import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertOperationalLeagueMatch,
  resolveClientLeagueId,
} from "./assert-league-scope";
import type { AuthContext } from "./withAuth";

const LEAGUE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const LEAGUE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("assertOperationalLeagueMatch", () => {
  it("permite SUPER_ADMIN sobre cualquier liga", () => {
    const context: AuthContext = {
      userId: "user-1",
      role: "SUPER_ADMIN",
      leagueId: LEAGUE_A,
    };
    assert.equal(assertOperationalLeagueMatch(context, LEAGUE_B), null);
  });

  it("permite LEAGUE_ADMIN en su liga", () => {
    const context: AuthContext = {
      userId: "user-1",
      role: "LEAGUE_ADMIN",
      leagueId: LEAGUE_A,
    };
    assert.equal(assertOperationalLeagueMatch(context, LEAGUE_A), null);
  });

  it("bloquea LEAGUE_ADMIN en liga ajena", () => {
    const context: AuthContext = {
      userId: "user-1",
      role: "LEAGUE_ADMIN",
      leagueId: LEAGUE_A,
    };
    assert.equal(
      assertOperationalLeagueMatch(context, LEAGUE_B),
      "No tienes permiso para operar sobre esta liga.",
    );
  });

  it("bloquea delegado sin liga en JWT", () => {
    const context: AuthContext = {
      userId: "user-1",
      role: "CLUB_DELEGATE",
      clubId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    };
    assert.equal(
      assertOperationalLeagueMatch(context, LEAGUE_A),
      "Sesión sin liga asignada. Contacta al administrador.",
    );
  });
});

describe("resolveClientLeagueId", () => {
  it("SUPER_ADMIN puede usar leagueId del formulario", () => {
    const context: AuthContext = {
      userId: "user-1",
      role: "SUPER_ADMIN",
      leagueId: LEAGUE_A,
    };
    assert.equal(resolveClientLeagueId(context, LEAGUE_B), LEAGUE_B);
  });

  it("LEAGUE_ADMIN ignora leagueId del formulario", () => {
    const context: AuthContext = {
      userId: "user-1",
      role: "LEAGUE_ADMIN",
      leagueId: LEAGUE_A,
    };
    assert.equal(resolveClientLeagueId(context, LEAGUE_B), LEAGUE_A);
  });
});
