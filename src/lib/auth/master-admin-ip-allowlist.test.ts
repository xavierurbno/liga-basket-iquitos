import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  isIpAllowedForMasterAdmin,
  isMasterAdminIpAllowlistConfigured,
} from "./master-admin-ip-allowlist.ts";

describe("master-admin-ip-allowlist", () => {
  const original = process.env.MASTER_SUPER_ADMIN_IP_ALLOWLIST;

  beforeEach(() => {
    delete process.env.MASTER_SUPER_ADMIN_IP_ALLOWLIST;
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.MASTER_SUPER_ADMIN_IP_ALLOWLIST;
    } else {
      process.env.MASTER_SUPER_ADMIN_IP_ALLOWLIST = original;
    }
  });

  it("sin env configurado no restringe IP", () => {
    assert.equal(isMasterAdminIpAllowlistConfigured(), false);
    assert.equal(isIpAllowedForMasterAdmin("203.0.113.1"), true);
    assert.equal(isIpAllowedForMasterAdmin(null), true);
  });

  it("con allowlist solo permite IPs listadas", () => {
    process.env.MASTER_SUPER_ADMIN_IP_ALLOWLIST = " 203.0.113.1 , 198.51.100.2 ";
    assert.equal(isMasterAdminIpAllowlistConfigured(), true);
    assert.equal(isIpAllowedForMasterAdmin("203.0.113.1"), true);
    assert.equal(isIpAllowedForMasterAdmin("198.51.100.2"), true);
    assert.equal(isIpAllowedForMasterAdmin("10.0.0.1"), false);
    assert.equal(isIpAllowedForMasterAdmin("unknown"), false);
    assert.equal(isIpAllowedForMasterAdmin(null), false);
  });

  it("acepta IPv4 mapeada en IPv6 (::ffff:)", () => {
    process.env.MASTER_SUPER_ADMIN_IP_ALLOWLIST = "203.0.113.1";
    assert.equal(isIpAllowedForMasterAdmin("::ffff:203.0.113.1"), true);
    assert.equal(isIpAllowedForMasterAdmin("::FFFF:203.0.113.1"), true);
  });
});
