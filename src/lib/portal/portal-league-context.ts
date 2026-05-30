import { cache } from "react";
import { QueryTimeoutError } from "@/lib/db/query-timeout";
import { withQueryTimeout } from "@/lib/db/query-timeout";
import {
  fetchPortalLeagueBranding,
  readPortalLeagueIdFromEnv,
  resolveDefaultPortalLeagueId,
} from "@/lib/portal/portal-league-cache";

const LEAGUE_MS =
  process.env.NODE_ENV === "development" ? 15_000 : 8_000;

import type { LeaguePortalBranding } from "@/lib/leagues/league-branding";
import { loadLeaguePortalBranding } from "@/lib/leagues/league-branding";

export type PortalLeagueRow = LeaguePortalBranding;

/**
 * Resuelve la liga del portal.
 * Prioridad: slug en ruta `/l/[slug]` → `?l=` → cookie → default → env.
 */
export const resolvePortalLeagueContext = cache(
  async (opts: {
    pathSlug?: string;
    querySlug?: string;
    cookieSlug?: string;
  }): Promise<PortalLeagueRow | null> => {
    try {
      const path = opts.pathSlug?.trim();
      if (path) {
        const byPath = await withQueryTimeout(
          fetchPortalLeagueBranding(path),
          LEAGUE_MS,
          "portalLeagueByPath",
        );
        return byPath ?? null;
      }

      if (opts.querySlug?.trim()) {
        const byQuery = await withQueryTimeout(
          fetchPortalLeagueBranding(opts.querySlug.trim()),
          LEAGUE_MS,
          "portalLeagueByQuery",
        );
        if (byQuery) return byQuery;
      }

      if (opts.cookieSlug?.trim()) {
        const byCookie = await withQueryTimeout(
          fetchPortalLeagueBranding(opts.cookieSlug.trim()),
          LEAGUE_MS,
          "portalLeagueByCookie",
        );
        if (byCookie) return byCookie;
      }

      const defaultId = await withQueryTimeout(
        resolveDefaultPortalLeagueId(),
        LEAGUE_MS,
        "portalLeagueDefault",
      );
      if (defaultId) {
        const { leagueRepository } = await import("@/repositories/league.repository");
        const row = await leagueRepository.findById(defaultId);
        if (row) {
          return loadLeaguePortalBranding(row);
        }
      }

      const envId = readPortalLeagueIdFromEnv();
      if (envId) {
        const { leagueRepository } = await import("@/repositories/league.repository");
        const row = await leagueRepository.findById(envId);
        if (row) {
          return loadLeaguePortalBranding(row);
        }
      }

      return null;
    } catch (err) {
      if (err instanceof QueryTimeoutError) {
        console.warn(`[portal] resolvePortalLeagueContext timeout (${err.label})`);
      } else {
        console.error("[portal] resolvePortalLeagueContext:", err);
      }
      return null;
    }
  },
);
