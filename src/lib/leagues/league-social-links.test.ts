import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildLeagueSocialLinks,
  normalizeSocialNetworkUrl,
  normalizeWhatsappUrl,
} from "./league-social-links";

describe("league-social-links", () => {
  it("normaliza WhatsApp desde número peruano", () => {
    assert.equal(normalizeWhatsappUrl("965432100"), "https://wa.me/51965432100");
  });

  it("valida Facebook", () => {
    assert.equal(
      normalizeSocialNetworkUrl("facebook", "facebook.com/mi-liga"),
      "https://facebook.com/mi-liga",
    );
  });

  it("construye solo redes configuradas", () => {
    const links = buildLeagueSocialLinks({
      socialInstagramUrl: "https://instagram.com/lddbi",
      socialFacebookUrl: null,
    });
    assert.equal(links.length, 1);
    assert.equal(links[0]?.id, "instagram");
  });
});
