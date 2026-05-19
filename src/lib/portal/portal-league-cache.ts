import { cache } from "react";
import { unstable_cache } from "next/cache";
import { leagueRepository } from "@/repositories/league.repository";

const CACHE_REVALIDATE_SEC = 120;
const MEM_TTL_MS = 120_000;

type LeagueRow = { id: string; name: string; slug: string } | null;

const fetchDefaultLeagueCached = unstable_cache(
  () => leagueRepository.findDefaultForPortal(),
  ["portal-league-default"],
  { revalidate: CACHE_REVALIDATE_SEC },
);

const fetchLeagueBySlugCached = (slug: string) =>
  unstable_cache(
    () => leagueRepository.findBySlug(slug),
    ["portal-league-slug", slug],
    { revalidate: CACHE_REVALIDATE_SEC },
  )();

/** Evita N consultas paralelas al pool en la misma instancia Node (RSC + Suspense). */
let defaultLeagueInflight: Promise<LeagueRow> | null = null;
let defaultLeagueMem: { row: LeagueRow; expiresAt: number } | null = null;

async function loadDefaultLeagueRow(): Promise<LeagueRow> {
  const now = Date.now();
  if (defaultLeagueMem && defaultLeagueMem.expiresAt > now) {
    return defaultLeagueMem.row;
  }

  if (!defaultLeagueInflight) {
    defaultLeagueInflight = fetchDefaultLeagueCached()
      .then((row) => {
        defaultLeagueMem = { row: row ?? null, expiresAt: Date.now() + MEM_TTL_MS };
        return row ?? null;
      })
      .finally(() => {
        defaultLeagueInflight = null;
      });
  }

  return defaultLeagueInflight;
}

/** UUID de liga cuando la BD no responde (opcional en `.env.local`). */
export function readPortalLeagueIdFromEnv(): string | undefined {
  const id = process.env.NEXT_PUBLIC_DEFAULT_LEAGUE_ID?.trim();
  return id || undefined;
}

/** Liga por defecto (deduplicada por request + memoria + unstable_cache). */
export const resolveDefaultPortalLeagueId = cache(async (): Promise<string | undefined> => {
  const fromEnv = readPortalLeagueIdFromEnv();
  try {
    const row = await loadDefaultLeagueRow();
    return row?.id ?? fromEnv;
  } catch {
    return fromEnv;
  }
});

export async function fetchPortalLeagueBySlug(slug: string) {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  return fetchLeagueBySlugCached(trimmed);
}
