import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveLegacyRouteRedirectFromPath } from "./legacy-route-redirects";

describe("legacy-route-redirects", () => {
  it("redirige /liga/clubes a /liga/clubs", () => {
    const r = resolveLegacyRouteRedirectFromPath("/liga/clubes/abc/");
    assert.equal(r?.pathname, "/liga/clubs/abc/");
  });

  it("redirige torneos legado a portal /l/", () => {
    const r = resolveLegacyRouteRedirectFromPath("/torneos/lddbi-iquitos/copa-2025/");
    assert.equal(r?.pathname, "/l/lddbi-iquitos/torneos/copa-2025/");
    assert.equal(r?.permanent, true);
  });

  it("redirige normativas dashboard a /normativas/", () => {
    const r = resolveLegacyRouteRedirectFromPath("/dashboard/normativas/");
    assert.equal(r?.pathname, "/normativas/");
  });

  it("redirige busqueda intranet con slug activo", () => {
    const r = resolveLegacyRouteRedirectFromPath("/liga/busqueda-365/", {
      activeLeagueSlug: "lddbi-iquitos",
    });
    assert.equal(r?.pathname, "/l/lddbi-iquitos/busqueda-365/");
  });
});
