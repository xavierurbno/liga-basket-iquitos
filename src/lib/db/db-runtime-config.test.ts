import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  shouldUseAppDb,
  useAppDbForReads,
  useAppDbForWrites,
} from "./db-runtime-config";

describe("db-runtime-config", () => {
  const origRead = process.env.USE_APP_DB_ROLE;
  const origWrite = process.env.USE_APP_DB_ROLE_WRITES;

  it("owner intent nunca usa app db", () => {
    process.env.USE_APP_DB_ROLE = "true";
    process.env.USE_APP_DB_ROLE_WRITES = "true";
    assert.equal(shouldUseAppDb("owner"), false);
  });

  it("respeta flags de lectura/escritura", () => {
    process.env.USE_APP_DB_ROLE = "true";
    process.env.USE_APP_DB_ROLE_WRITES = "false";
    assert.equal(useAppDbForReads(), true);
    assert.equal(useAppDbForWrites(), false);
    assert.equal(shouldUseAppDb("read"), true);
    assert.equal(shouldUseAppDb("write"), false);
  });

  it("rollback: flags apagados → owner", () => {
    process.env.USE_APP_DB_ROLE = "false";
    process.env.USE_APP_DB_ROLE_WRITES = "false";
    assert.equal(shouldUseAppDb("read"), false);
    assert.equal(shouldUseAppDb("write"), false);
  });

  process.env.USE_APP_DB_ROLE = origRead;
  process.env.USE_APP_DB_ROLE_WRITES = origWrite;
});
