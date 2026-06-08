import { resolveLeagueCarnetPrefix } from "@/lib/leagues/league-carnet-prefix";
import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";

export type NewLeagueKind = "federated" | "tournament";

export type NewLeagueSettingsDefaults = {
  carnetThemePreset: string;
  carnetShowFederation: boolean;
  carnetSignatureMode: string;
  documentSerialPrefix: string;
};

/** Defaults al crear liga: LDDBI/Iquitos o federada vs torneo local. */
export function resolveNewLeagueSettingsDefaults(
  slug: string,
  name: string,
  leagueKind: NewLeagueKind,
): NewLeagueSettingsDefaults {
  const isPrimary = isPrimaryPortalLeagueSlug(slug);
  const federated = isPrimary || leagueKind === "federated";

  if (federated) {
    return {
      carnetThemePreset: "lddbi_template",
      carnetShowFederation: true,
      carnetSignatureMode: "both",
      documentSerialPrefix: "LDDBI",
    };
  }

  const prefix = resolveLeagueCarnetPrefix({ slug, name }).slice(0, 12);

  return {
    carnetThemePreset: "esquinas_clasica_reverso",
    carnetShowFederation: false,
    carnetSignatureMode: "president",
    documentSerialPrefix: prefix,
  };
}
