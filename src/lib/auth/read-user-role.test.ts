import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readUserRole, canUploadNormativaDoc } from "./read-user-role";

describe("read-user-role", () => {
  it("lee rol solo desde app_metadata", () => {
    const user = {
      id: "u1",
      app_metadata: { role: "LEAGUE_ADMIN" },
      user_metadata: { role: "SUPER_ADMIN" },
    } as import("@supabase/supabase-js").User;

    assert.equal(readUserRole(user), "LEAGUE_ADMIN");
  });

  it("ignora user_metadata si no hay app_metadata", () => {
    const user = {
      id: "u2",
      app_metadata: {},
      user_metadata: { role: "SUPER_ADMIN" },
    } as import("@supabase/supabase-js").User;

    assert.equal(readUserRole(user), undefined);
  });

  it("canUploadNormativaDoc solo para staff", () => {
    assert.equal(canUploadNormativaDoc("LEAGUE_ADMIN"), true);
    assert.equal(canUploadNormativaDoc("CLUB_DELEGATE"), false);
    assert.equal(canUploadNormativaDoc(undefined), false);
  });
});
