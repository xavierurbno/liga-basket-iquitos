import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  checkRateLimit,
  resetRateLimitStoreForTests,
  RATE_LIMITS,
} from "./rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    delete process.env.SECURITY_RATE_LIMIT_DISABLED;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  it("permite solicitudes dentro del límite", async () => {
    const config = { limit: 3, windowMs: 60_000 };
    for (let i = 0; i < 3; i += 1) {
      const result = await checkRateLimit("login", "1.2.3.4", config);
      assert.equal(result.allowed, true);
    }
  });

  it("bloquea cuando se supera el límite", async () => {
    const config = { limit: 2, windowMs: 60_000 };
    await checkRateLimit("validar", "9.9.9.9", config);
    await checkRateLimit("validar", "9.9.9.9", config);
    const blocked = await checkRateLimit("validar", "9.9.9.9", config);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSec >= 1);
  });

  it("aisla claves por scope e IP", async () => {
    const config = { limit: 1, windowMs: 60_000 };
    await checkRateLimit("busqueda365", "a", config);
    const otherIp = await checkRateLimit("busqueda365", "b", config);
    const otherScope = await checkRateLimit("login", "a", config);
    assert.equal(otherIp.allowed, true);
    assert.equal(otherScope.allowed, true);
  });

  it("respeta SECURITY_RATE_LIMIT_DISABLED", async () => {
    process.env.SECURITY_RATE_LIMIT_DISABLED = "true";
    for (let i = 0; i < RATE_LIMITS.login.limit + 5; i += 1) {
      const result = await checkRateLimit("login", "disabled-ip");
      assert.equal(result.allowed, true);
    }
  });
});
