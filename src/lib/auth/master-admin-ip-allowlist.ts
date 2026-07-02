/**
 * Allowlist opcional de IP para la cuenta `MASTER_SUPER_ADMIN_EMAIL`.
 * Si `MASTER_SUPER_ADMIN_IP_ALLOWLIST` está vacío, no se restringe (desarrollo local).
 */

import { expandIpVariantsForAllowlist } from "@/lib/security/client-ip";

export { expandIpVariantsForAllowlist };

export const MASTER_ADMIN_IP_BLOCKED_CODE = "ip_not_allowed";

export const MASTER_ADMIN_IP_BLOCKED_MESSAGE =
  "Tu IP no está autorizada para la cuenta maestra. Inicia sesión con otra cuenta o desde una red permitida.";

function parseAllowlist(): Set<string> {
  const raw = process.env.MASTER_SUPER_ADMIN_IP_ALLOWLIST?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function buildNormalizedAllowlist(): Set<string> {
  const normalized = new Set<string>();
  for (const entry of parseAllowlist()) {
    for (const variant of expandIpVariantsForAllowlist(entry)) {
      normalized.add(variant);
    }
  }
  return normalized;
}

export function isMasterAdminIpAllowlistConfigured(): boolean {
  return parseAllowlist().size > 0;
}

export type MasterAdminIpCheckMode = "enforce" | "enforce-if-known";

export function isIpAllowedForMasterAdmin(
  clientIp: string | null | undefined,
  mode: MasterAdminIpCheckMode = "enforce",
): boolean {
  const allowlist = buildNormalizedAllowlist();
  if (allowlist.size === 0) return true;
  const ip = clientIp?.trim();
  if (!ip || ip === "unknown") {
    return mode === "enforce-if-known";
  }

  for (const variant of expandIpVariantsForAllowlist(ip)) {
    if (allowlist.has(variant)) return true;
  }
  return false;
}

export function resolveMasterAdminAuthErrorMessage(
  code: string | null | undefined,
): string | undefined {
  const raw = code?.trim();
  if (!raw) return undefined;
  if (raw === MASTER_ADMIN_IP_BLOCKED_CODE) return MASTER_ADMIN_IP_BLOCKED_MESSAGE;
  return raw;
}
