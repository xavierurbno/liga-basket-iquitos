import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  expandIpVariantsForAllowlist,
  getClientIpFromHeaders,
  getClientIpFromRequest,
  normalizeIpv6Address,
} from "./client-ip.ts";

describe("client-ip", () => {
  it("prioriza x-vercel-forwarded-for", () => {
    const ip = getClientIpFromHeaders({
      get(name: string) {
        if (name === "x-vercel-forwarded-for") return "179.6.251.119, 10.0.0.1";
        if (name === "x-forwarded-for") return "203.0.113.1";
        return null;
      },
    });
    assert.equal(ip, "179.6.251.119");
  });

  it("usa request.ip cuando está disponible", () => {
    const ip = getClientIpFromRequest({
      ip: "179.6.251.119",
      headers: { get: () => null },
    });
    assert.equal(ip, "179.6.251.119");
  });

  it("normaliza IPv6 equivalentes", () => {
    const a = normalizeIpv6Address("2800:4b0:8803:b44c:21e0:396:3ef6:a61c");
    const b = normalizeIpv6Address("2800:04b0:8803:b44c:21e0:0396:3ef6:a61c");
    assert.equal(a, b);
    assert.ok(
      expandIpVariantsForAllowlist("2800:4b0:8803:b44c:21e0:396:3ef6:a61c").includes(a!),
    );
  });
});
