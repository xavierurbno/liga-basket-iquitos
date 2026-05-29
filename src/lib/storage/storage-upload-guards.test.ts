import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildGalleryStoragePath,
  isStorageUuidSegment,
  validateGalleryUploadFile,
} from "./storage-upload-guards.ts";

describe("storage-upload-guards", () => {
  it("rechaza MIME no permitido", () => {
    const file = { name: "x.gif", size: 100, type: "image/gif" } as File;
    assert.match(validateGalleryUploadFile(file)!, /Tipo no permitido/);
  });

  it("construye path gallery seguro", () => {
    const path = buildGalleryStoragePath(
      "550e8400-e29b-41d4-a716-446655440000",
      "foto.jpg",
    );
    assert.equal(
      path,
      "gallery/550e8400-e29b-41d4-a716-446655440000/foto.jpg",
    );
  });

  it("valida UUID de segmento", () => {
    assert.equal(isStorageUuidSegment("550e8400-e29b-41d4-a716-446655440000"), true);
    assert.equal(isStorageUuidSegment("../etc"), false);
  });
});
