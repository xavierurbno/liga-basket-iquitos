import { resolveLeagueCarnetPrefix } from "@/lib/leagues/league-carnet-prefix";
import { isPlatformDefaultLeagueSlug } from "@/lib/platform/platform-config";

export type NewLeagueKind = "federated" | "tournament";

export type NewLeagueSettingsDefaults = {
  carnetThemePreset: string;
  carnetShowFederation: boolean;
  carnetSignatureMode: string;
  documentSerialPrefix: string;
};

/** Defaults al crear liga: liga por defecto del programa vs torneo local. */
export function resolveNewLeagueSettingsDefaults(
  slug: string,
  name: string,
  leagueKind: NewLeagueKind,
): NewLeagueSettingsDefaults {
  const isDefaultLeague = isPlatformDefaultLeagueSlug(slug);
  const federated = isDefaultLeague || leagueKind === "federated";

  if (federated) {
    return {
      carnetThemePreset: isDefaultLeague ? "lddbi_template" : "esquinas_color",
      carnetShowFederation: true,
      carnetSignatureMode: "both",
      documentSerialPrefix: isDefaultLeague
        ? "LDDBI"
        : resolveLeagueCarnetPrefix({ slug, name }).slice(0, 12),
    };
  }

  const prefix = resolveLeagueCarnetPrefix({ slug, name }).slice(0, 12);

  return {
    carnetThemePreset: "esquinas_color",
    carnetShowFederation: false,
    carnetSignatureMode: "president",
    documentSerialPrefix: prefix,
  };
}
