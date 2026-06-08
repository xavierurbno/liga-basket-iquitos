import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildDocumentPlayerSearchConditions,
  resolveDocumentSearchScope,
} from "./document-search-scope";
import type { AuthContext } from "./withAuth";

const LEAGUE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const LEAGUE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("document-search-scope", () => {
  it("LEAGUE_ADMIN sin liga activa devuelve error", () => {
    const context: AuthContext = {
      userId: "admin-1",
      role: "LEAGUE_ADMIN",
    };
    const scope = resolveDocumentSearchScope(context);
    assert.ok("error" in scope);
    const where = buildDocumentPlayerSearchConditions("DNI", "12345678", context);
    assert.ok("error" in where);
  });

  it("LEAGUE_ADMIN acota búsqueda a su liga", () => {
    const context: AuthContext = {
      userId: "admin-1",
      role: "LEAGUE_ADMIN",
      leagueId: LEAGUE_A,
    };
    const scope = resolveDocumentSearchScope(context);
    assert.deepEqual(scope, { kind: "league", leagueId: LEAGUE_A });
    const where = buildDocumentPlayerSearchConditions("DNI", "12345678", context);
    assert.ok(!("error" in where));
  });

  it("SUPER_ADMIN con liga activa acota a esa liga", () => {
    const context: AuthContext = {
      userId: "super-1",
      role: "SUPER_ADMIN",
      leagueId: LEAGUE_B,
    };
    const scope = resolveDocumentSearchScope(context);
    assert.deepEqual(scope, { kind: "league", leagueId: LEAGUE_B });
  });

  it("SUPER_ADMIN sin liga activa permite búsqueda global", () => {
    const context: AuthContext = {
      userId: "super-1",
      role: "SUPER_ADMIN",
    };
    const scope = resolveDocumentSearchScope(context);
    assert.deepEqual(scope, { kind: "global" });
    const where = buildDocumentPlayerSearchConditions("DNI", "12345678", context);
    assert.ok(!("error" in where));
  });
});
