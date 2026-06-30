import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildPlayerPhotoStoragePath,
  extractPlayerPhotoStoragePath,
  isPlayerPhotoStoragePath,
} from "./player-photo-storage.ts";

describe("player-photo-storage", () => {
  const leagueId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const clubId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  it("buildPlayerPhotoStoragePath no incluye DNI en el path", () => {
    const path = buildPlayerPhotoStoragePath(leagueId, clubId, "jpg");
    assert.match(path, /^leagues\/.+\/clubs\/.+\/players\/[0-9a-f-]{36}\.jpg$/i);
    assert.doesNotMatch(path, /12345678/);
  });

  it("extractPlayerPhotoStoragePath desde path crudo", () => {
    const raw = "leagues/x/clubs/y/players/z.jpg";
    assert.equal(extractPlayerPhotoStoragePath(raw), raw);
  });

  it("extractPlayerPhotoStoragePath desde URL pública legacy", () => {
    const url =
      "https://proj.supabase.co/storage/v1/object/public/jugador-fotos/leagues/l1/clubs/c1/players/uuid.jpg";
    assert.equal(
      extractPlayerPhotoStoragePath(url),
      "leagues/l1/clubs/c1/players/uuid.jpg",
    );
  });

  it("isPlayerPhotoStoragePath distingue URL absoluta", () => {
    assert.equal(isPlayerPhotoStoragePath("leagues/a/clubs/b/players/c.jpg"), true);
    assert.equal(
      isPlayerPhotoStoragePath("https://example.com/photo.jpg"),
      false,
    );
  });
});
