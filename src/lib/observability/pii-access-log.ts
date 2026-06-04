import { headers } from "next/headers";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";
import {
  fingerprintDocument,
  fingerprintOpaqueToken,
  fingerprintSearchTerm,
} from "@/lib/observability/pii-fingerprint";
import { logSecurityEvent } from "@/lib/observability/security-log";

function normalizeClientIp(ip: string | null | undefined): string | null {
  if (!ip || ip === "unknown") return null;
  return ip.length > 45 ? ip.slice(0, 45) : ip;
}

export async function resolvePiiLogClientIp(
  clientIp?: string | null,
): Promise<string | null> {
  if (clientIp !== undefined) return normalizeClientIp(clientIp);
  try {
    const headerStore = await headers();
    return normalizeClientIp(getClientIpFromHeaders(headerStore));
  } catch {
    return null;
  }
}

/** Consulta pública `/validar/[token]`. */
export async function logValidarView(input: {
  tokenSegment: string;
  lookup?: "player" | "category";
  entityId?: string | null;
  outcome: "found" | "not_found" | "invalid_token";
  clientIp?: string | null;
}): Promise<void> {
  const { tokenHash, legacyUuid } = fingerprintOpaqueToken(input.tokenSegment);
  const clientIp = await resolvePiiLogClientIp(input.clientIp);

  logSecurityEvent(
    {
      type: "pii.validar.view",
      message: `Consulta /validar (${input.outcome})`,
      meta: {
        outcome: input.outcome,
        lookup: input.lookup ?? null,
        entityId: input.entityId ?? null,
        tokenHash,
        legacyUuid,
        clientIp,
      },
    },
    { level: "info" },
  );
}

/** Consultas Busqueda365 (categorías o plantilla). */
export async function logBusqueda365Query(input: {
  leagueId: string;
  operation: "list_categories" | "list_roster";
  categoryId?: string | null;
  searchTerm?: string | null;
  resultCount?: number;
  clientIp?: string | null;
}): Promise<void> {
  const clientIp = await resolvePiiLogClientIp(input.clientIp);
  const meta: Record<string, string | number | boolean | null | undefined> = {
    operation: input.operation,
    leagueId: input.leagueId,
    categoryId: input.categoryId ?? null,
    resultCount: input.resultCount ?? null,
    clientIp,
  };

  if (input.searchTerm?.trim()) {
    const { termLen, termHash } = fingerprintSearchTerm(input.searchTerm);
    meta.searchTermLen = termLen;
    meta.searchTermHash = termHash;
  }

  logSecurityEvent(
    {
      type: "pii.busqueda365.query",
      message: `Busqueda365 ${input.operation}`,
      leagueId: input.leagueId,
      meta,
    },
    { level: "info" },
  );
}

/** Búsqueda intranet por documento de jugador (Gestión documental). */
export async function logDocumentSearchByPlayer(input: {
  userId: string;
  role?: string | null;
  leagueId?: string | null;
  documentType: string;
  documentNumber: string;
  found: boolean;
  playerId?: string | null;
  clientIp?: string | null;
}): Promise<void> {
  const { docLast4, docHash } = fingerprintDocument(input.documentNumber, input.documentType);
  const clientIp = await resolvePiiLogClientIp(input.clientIp);

  logSecurityEvent(
    {
      type: "pii.document.search",
      message: `Búsqueda documento jugador (${input.found ? "hit" : "miss"})`,
      userId: input.userId,
      role: input.role ?? undefined,
      leagueId: input.leagueId ?? undefined,
      route: "/liga/documentos",
      meta: {
        scope: "player_document",
        documentType: input.documentType,
        docLast4,
        docHash,
        found: input.found,
        playerId: input.playerId ?? null,
        clientIp,
      },
    },
    { level: "info" },
  );
}

/** Búsqueda intranet de clubes para emisión documental. */
export async function logDocumentClubSearch(input: {
  userId: string;
  role?: string | null;
  leagueId?: string | null;
  query: string;
  resultCount: number;
  clientIp?: string | null;
}): Promise<void> {
  const { termLen, termHash } = fingerprintSearchTerm(input.query);
  const clientIp = await resolvePiiLogClientIp(input.clientIp);

  logSecurityEvent(
    {
      type: "pii.document.search",
      message: `Búsqueda club documentos (${input.resultCount} resultados)`,
      userId: input.userId,
      role: input.role ?? undefined,
      leagueId: input.leagueId ?? undefined,
      route: "/liga/documentos",
      meta: {
        scope: "club_name",
        termLen,
        termHash,
        resultCount: input.resultCount,
        clientIp,
      },
    },
    { level: "info" },
  );
}
