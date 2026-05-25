import "server-only";

import path from "path";
import fs from "fs/promises";
import { DEFAULT_PUBLIC_LEAGUE_LOGO } from "@/lib/logos/public-league-logo";
import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";

const DISK_CANDIDATES = [
  { url: "/logo-liga.png", file: "logo-liga.png", dir: "public" as const },
  { url: "/logos/logo-lddbi.png", file: "logo-lddbi.png", dir: "logos" as const },
  { url: "/logos/liga.png", file: "liga.png", dir: "logos" as const },
];

/**
 * Primera imagen existente en `public/` para la liga principal (Iquitos / LDDBI).
 */
export async function resolvePublicLeagueLogoUrlFromDisk(): Promise<string | null> {
  const root = path.join(process.cwd(), "public");

  for (const { url, file, dir } of DISK_CANDIDATES) {
    const candidate =
      dir === "public" ? path.join(root, file) : path.join(root, "logos", file);
    try {
      await fs.access(candidate);
      return url;
    } catch {
      /* siguiente */
    }
  }

  return null;
}

/**
 * URL de logo para portal/login: Supabase (`login_logo_url`) o archivo en `public/` (solo liga principal).
 */
export async function resolveLeagueDisplayLogoUrl(opts: {
  slug: string;
  loginLogoUrl?: string | null;
}): Promise<string | null> {
  const remote = opts.loginLogoUrl?.trim();
  if (remote) return remote;

  if (!isPrimaryPortalLeagueSlug(opts.slug)) {
    return null;
  }

  return (await resolvePublicLeagueLogoUrlFromDisk()) ?? DEFAULT_PUBLIC_LEAGUE_LOGO;
}
