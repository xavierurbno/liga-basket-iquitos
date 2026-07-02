import { cache } from "react";
import { unstable_cache } from "next/cache";
import { unauthenticatedReadDb } from "@/lib/db/operational-db-access";
import { leagueRepository } from "@/repositories/league.repository";
import { loadLeaguePortalBranding, type LeaguePortalBranding } from "@/lib/leagues/league-branding";

const CACHE_REVALIDATE_SEC = 120;
const MEM_TTL_MS = 120_000;

type LeagueRow = { id: string; name: string; slug: string } | null;

const fetchDefaultLeagueCached = unstable_cache(
  () => leagueRepository.findDefaultForPortal(unauthenticatedReadDb()),
  ["portal-league-default-v2"],
  { revalidate: CACHE_REVALIDATE_SEC },
);

const fetchLeagueBySlugCached = (slug: string) =>
  unstable_cache(
    () => leagueRepository.findBySlug(slug, unauthenticatedReadDb()),
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

/** Liga + branding de portal para `/l/[slug]/` y login. */
export async function fetchPortalLeagueBranding(slug: string): Promise<LeaguePortalBranding | null> {
  const league = await fetchPortalLeagueBySlug(slug);
  if (!league) return null;
  return loadLeaguePortalBranding(league);
}
