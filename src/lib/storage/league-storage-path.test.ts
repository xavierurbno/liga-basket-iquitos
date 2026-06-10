import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  leagueStoragePath,
  storageObjectPathFromPublicUrl,
} from "./league-storage-path";

const LEAGUE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("leagueStoragePath", () => {
  it("prefija leagues/{leagueId}", () => {
    assert.equal(
      leagueStoragePath(LEAGUE, "gallery", "photo.jpg"),
      `leagues/${LEAGUE}/gallery/photo.jpg`,
    );
  });

  it("elimina caracteres no seguros en segmentos", () => {
    assert.equal(
      leagueStoragePath(LEAGUE, "sponsors", "file<script>.jpg"),
      `leagues/${LEAGUE}/sponsors/filescript.jpg`,
    );
  });
});

describe("storageObjectPathFromPublicUrl", () => {
  it("extrae path canónico de URL Supabase", () => {
    const url =
      "https://xxx.supabase.co/storage/v1/object/public/galeria/leagues/uuid/gallery/a.jpg";
    assert.equal(
      storageObjectPathFromPublicUrl(url, "galeria"),
      "leagues/uuid/gallery/a.jpg",
    );
  });

  it("fallback legacy gallery/filename", () => {
    assert.equal(
      storageObjectPathFromPublicUrl("https://cdn.example.com/x/y/abc.jpg", "galeria"),
      "gallery/abc.jpg",
    );
  });
});
