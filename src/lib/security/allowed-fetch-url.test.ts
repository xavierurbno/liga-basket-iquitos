import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { isAllowedInstitutionalAssetUrl } from "./allowed-fetch-url";

describe("allowed-fetch-url", () => {
  const prevSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prevSite = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc123.supabase.co";
    process.env.NEXT_PUBLIC_SITE_URL = "https://liga-basket-iquitos.vercel.app";
  });

  afterEach(() => {
    if (prevSupabase === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = prevSupabase;
    if (prevSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prevSite;
  });

  it("permite rutas relativas en public", () => {
    assert.equal(isAllowedInstitutionalAssetUrl("/logos/liga.png"), true);
  });

  it("bloquea path traversal", () => {
    assert.equal(isAllowedInstitutionalAssetUrl("/logos/../etc/passwd"), false);
  });

  it("permite storage público de Supabase del proyecto", () => {
    assert.equal(
      isAllowedInstitutionalAssetUrl(
        "https://abc123.supabase.co/storage/v1/object/public/club-assets/leagues/x/logo.png",
      ),
      true,
    );
  });

  it("bloquea localhost e IPs privadas", () => {
    assert.equal(isAllowedInstitutionalAssetUrl("http://127.0.0.1/logo.png"), false);
    assert.equal(isAllowedInstitutionalAssetUrl("http://169.254.169.254/latest/meta-data"), false);
    assert.equal(isAllowedInstitutionalAssetUrl("http://192.168.1.1/logo.png"), false);
  });

  it("bloquea dominios arbitrarios", () => {
    assert.equal(isAllowedInstitutionalAssetUrl("https://evil.example/logo.png"), false);
  });

  it("permite vacío", () => {
    assert.equal(isAllowedInstitutionalAssetUrl(""), true);
    assert.equal(isAllowedInstitutionalAssetUrl(null), true);
  });
});
