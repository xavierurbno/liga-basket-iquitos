import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  operationalReadDb,
  operationalWriteDb,
  unauthenticatedReadDb,
} from "./operational-db-access.ts";
import { dbOwner } from "./client.ts";

describe("operational-db-access", () => {
  const origRead = process.env.USE_APP_DB_ROLE;
  const origWrite = process.env.USE_APP_DB_ROLE_WRITES;

  function restore() {
    if (origRead === undefined) delete process.env.USE_APP_DB_ROLE;
    else process.env.USE_APP_DB_ROLE = origRead;
    if (origWrite === undefined) delete process.env.USE_APP_DB_ROLE_WRITES;
    else process.env.USE_APP_DB_ROLE_WRITES = origWrite;
  }

  it("con flags apagados usa owner para read/write/unauthenticated", () => {
    process.env.USE_APP_DB_ROLE = "false";
    process.env.USE_APP_DB_ROLE_WRITES = "false";
    assert.equal(operationalReadDb(), dbOwner);
    assert.equal(operationalWriteDb(), dbOwner);
    assert.equal(unauthenticatedReadDb(), dbOwner);
    restore();
  });

  it("unauthenticatedReadDb siempre es owner aunque USE_APP_DB_ROLE=true", () => {
    process.env.USE_APP_DB_ROLE = "true";
    process.env.USE_APP_DB_ROLE_WRITES = "true";
    assert.equal(unauthenticatedReadDb(), dbOwner);
    restore();
  });
});
