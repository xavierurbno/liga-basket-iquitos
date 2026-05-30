import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  buildSafeOAuthCallbackUrl,
  isAllowedOAuthRedirectUrl,
  isLocalDevHost,
} from "./oauth-redirect.ts";

describe("oauth-redirect", () => {
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of [
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_APP_URL",
      "VERCEL_URL",
      "AUTH_ALLOWED_REDIRECT_HOSTS",
    ]) {
      prev[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("acepta localhost en desarrollo", () => {
    assert.equal(isLocalDevHost("localhost"), true);
    assert.equal(
      isAllowedOAuthRedirectUrl("http://localhost:3001/auth/callback/?next=%2Fliga%2F"),
      true,
    );
  });

  it("rechaza HTTPS de host no permitido", () => {
    assert.equal(
      isAllowedOAuthRedirectUrl("https://evil.example/auth/callback/"),
      false,
    );
  });

  it("acepta host configurado en NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://liga-basket-iquitos.vercel.app";
    assert.equal(
      isAllowedOAuthRedirectUrl(
        "https://liga-basket-iquitos.vercel.app/auth/callback/?next=%2Fliga%2F",
      ),
      true,
    );
  });

  it("construye callback seguro desde origen permitido", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://liga-basket-iquitos.vercel.app";
    const url = buildSafeOAuthCallbackUrl(
      "https://liga-basket-iquitos.vercel.app",
      "/liga/tesoreria",
    );
    assert.ok(url?.includes("/auth/callback/"));
    assert.ok(url?.includes("next=%2Fliga%2Ftesoreria"));
  });

  it("rechaza next con protocol-relative", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://liga-basket-iquitos.vercel.app";
    const url = buildSafeOAuthCallbackUrl(
      "https://liga-basket-iquitos.vercel.app",
      "//evil.example",
    );
    assert.ok(url?.endsWith("next=%2Fliga%2F"));
  });

  it("acepta host inyectado desde el servidor (extraAllowedHosts)", () => {
    const url = buildSafeOAuthCallbackUrl(
      "https://liga-basket-iquitos.vercel.app",
      "/liga/",
      ["liga-basket-iquitos.vercel.app"],
    );
    assert.ok(url?.includes("/auth/callback/"));
  });
});
