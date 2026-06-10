import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractLeagueIdFromActionArgs } from "./extract-league-id-from-args";
import { checkLeagueIdFromArgsScope } from "./assert-action-scope";
import type { AuthContext } from "./withAuth";

const LEAGUE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const LEAGUE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("extractLeagueIdFromActionArgs", () => {
  it("extrae leagueId de FormData", () => {
    const fd = new FormData();
    fd.set("leagueId", LEAGUE_A);
    assert.equal(extractLeagueIdFromActionArgs([fd]), LEAGUE_A);
  });

  it("extrae leagueId de objeto tipado", () => {
    assert.equal(extractLeagueIdFromActionArgs([{ leagueId: LEAGUE_A }]), LEAGUE_A);
  });
});

describe("checkLeagueIdFromArgsScope", () => {
  it("bloquea LEAGUE_ADMIN con leagueId ajeno en FormData", () => {
    const context: AuthContext = {
      userId: "user-1",
      role: "LEAGUE_ADMIN",
      leagueId: LEAGUE_A,
    };
    const fd = new FormData();
    fd.set("leagueId", LEAGUE_B);
    assert.match(checkLeagueIdFromArgsScope(context, [fd]) ?? "", /No tienes permiso/);
  });

  it("ignora leagueId en args para SUPER_ADMIN", () => {
    const context: AuthContext = {
      userId: "user-1",
      role: "SUPER_ADMIN",
      leagueId: LEAGUE_A,
    };
    const fd = new FormData();
    fd.set("leagueId", LEAGUE_B);
    assert.equal(checkLeagueIdFromArgsScope(context, [fd]), null);
  });
});
