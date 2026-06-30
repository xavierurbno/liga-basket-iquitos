/**
 * Allowlist opcional de IP para la cuenta `MASTER_SUPER_ADMIN_EMAIL`.
 * Si `MASTER_SUPER_ADMIN_IP_ALLOWLIST` está vacío, no se restringe (desarrollo local).
 */

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

export function isMasterAdminIpAllowlistConfigured(): boolean {
  return parseAllowlist().size > 0;
}

export function isIpAllowedForMasterAdmin(clientIp: string | null | undefined): boolean {
  const allowlist = parseAllowlist();
  if (allowlist.size === 0) return true;
  const ip = clientIp?.trim();
  if (!ip || ip === "unknown") return false;
  return allowlist.has(ip);
}
