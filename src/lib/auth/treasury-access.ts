import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clubMembers, clubs } from "@/lib/db/schema";
import { isSystemOwnerEmail } from "@/lib/auth/system-owner";

const FULL_TREASURY_ROLES = new Set([
  "admin",
  "liga_admin",
  "system_admin",
  "system_owner",
]);

const CLUB_MANAGER_ROLES = new Set(["club_manager"]);

function normalizeRol(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function emailsFromEnv(key: string): Set<string> {
  const raw = process.env[key];
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

import {
  assertClubScopeForRead,
  type TreasuryAccess,
} from "@/lib/auth/treasury-scope";

export type { TreasuryAccess } from "@/lib/auth/treasury-scope";
export { assertClubScopeForRead } from "@/lib/auth/treasury-scope";

/**
 * Resuelve permisos de Tesorería en el dashboard de liga.
 * - `system_owner`: correos en SYSTEM_OWNER_EMAILS.
 * - `admin` (gestión total): correos en LIGA_ADMIN_EMAILS o role en club_members ∈ {ADMIN, LIGA_ADMIN, SYSTEM_ADMIN, SYSTEM_OWNER}.
 * - `club_manager`: solo lectura de transacciones de sus clubIds.
 */
export async function resolveTreasuryAccess(
  userId: string,
  email: string | null | undefined
): Promise<TreasuryAccess> {
  if (isSystemOwnerEmail(email) || emailsFromEnv("LIGA_ADMIN_EMAILS").has((email ?? "").trim().toLowerCase())) {
    return { kind: "full", clubIds: null };
  }

  const rows = await db
    .select({ clubId: clubMembers.clubId, role: clubMembers.role })
    .from(clubMembers)
    .where(and(eq(clubMembers.userId, userId), eq(clubMembers.active, true)));

  let hasFull = false;
  const managerClubIds = new Set<string>();

  for (const r of rows) {
    const nr = normalizeRol(r.role);
    if (FULL_TREASURY_ROLES.has(nr)) {
      hasFull = true;
      break;
    }
    if (CLUB_MANAGER_ROLES.has(nr)) {
      managerClubIds.add(r.clubId);
    }
  }

  if (hasFull) return { kind: "full", clubIds: null };
  if (managerClubIds.size > 0) {
    return { kind: "readonly", clubIds: [...managerClubIds] };
  }
  return { kind: "none" };
}

export async function assertClubExists(clubId: string): Promise<boolean> {
  const [row] = await db.select({ id: clubs.id }).from(clubs).where(eq(clubs.id, clubId)).limit(1);
  return Boolean(row);
}

/**
 * Impide registrar movimientos en clubes fuera del alcance del operador.
 * - Propietarios del sistema: sin límite.
 * - Resto con acceso full: club debe pertenecer a la liga operativa activa,
 *   salvo membresía ADMIN directa en ese club.
 */
export async function assertTreasuryWriteClubAccess(
  userId: string,
  email: string | null | undefined,
  clubId: string,
  operationalLeagueId?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await resolveTreasuryAccess(userId, email);
  if (access.kind !== "full") {
    return { ok: false, error: "No tienes permiso para registrar movimientos." };
  }

  const [club] = await db
    .select({ id: clubs.id, leagueId: clubs.leagueId })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);
  if (!club) return { ok: false, error: "Club no válido." };

  if (isSystemOwnerEmail(email)) return { ok: true };

  const scopeLeagueId = operationalLeagueId?.trim();
  if (!scopeLeagueId) {
    return {
      ok: false,
      error: "Selecciona una liga activa antes de registrar movimientos de tesorería.",
    };
  }

  if (!club.leagueId) {
    return { ok: false, error: "El club no tiene liga asignada." };
  }

  if (club.leagueId === scopeLeagueId) {
    return { ok: true };
  }

  const memberships = await db
    .select({ role: clubMembers.role })
    .from(clubMembers)
    .where(
      and(
        eq(clubMembers.userId, userId),
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.active, true),
      ),
    );

  const hasDirectAdmin = memberships.some((m) =>
    FULL_TREASURY_ROLES.has(normalizeRol(m.role)),
  );
  if (hasDirectAdmin) return { ok: true };

  return {
    ok: false,
    error: "No puedes registrar movimientos en clubes de otra liga.",
  };
}
