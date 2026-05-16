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

export type TreasuryAccess =
  | {
      kind: "full";
      /** null = todas las organizaciones / clubes */
      clubIds: null;
    }
  | {
      kind: "readonly";
      clubIds: string[];
    }
  | { kind: "none" };

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

export function assertClubScopeForRead(
  access: TreasuryAccess,
  filterClubId: string | null
): { clubIds: string[] | null } {
  if (access.kind === "none") return { clubIds: [] };
  if (access.kind === "full") {
    if (filterClubId) return { clubIds: [filterClubId] };
    return { clubIds: null };
  }
  if (filterClubId && !access.clubIds.includes(filterClubId)) {
    return { clubIds: [] };
  }
  if (filterClubId) return { clubIds: [filterClubId] };
  return { clubIds: access.clubIds };
}

export async function assertClubExists(clubId: string): Promise<boolean> {
  const [row] = await db.select({ id: clubs.id }).from(clubs).where(eq(clubs.id, clubId)).limit(1);
  return Boolean(row);
}
