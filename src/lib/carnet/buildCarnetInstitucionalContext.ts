import {
  buildCarnetAuthorizationText,
  resolveCarnetValidityLabel,
} from "@/lib/carnet/carnetInstitucionalText";
import { isLddbiCarnetPreset } from "@/lib/carnet/lddbiTemplateLayout";
import { resolveCarnetThemeConfig } from "@/lib/carnet/carnetTheme";
import type { LeagueSettings } from "@/lib/db/schema";
import type { CarnetInstitucionalInput } from "@/lib/types/carnet";

export function buildCarnetInstitucionalContext(
  leagueDisplayName: string,
  settings: LeagueSettings | null | undefined,
  leagueSlug?: string | null,
): CarnetInstitucionalInput {
  const name = leagueDisplayName.trim() || "Liga deportiva";
  const theme = resolveCarnetThemeConfig(settings);

  return {
    leagueDisplayName: name,
    leagueSlug: leagueSlug?.trim() || null,
    vigenciaLabel: resolveCarnetValidityLabel(
      settings?.carnetValidityLabel,
      settings?.seasonName,
    ),
    presidentDisplayName: settings?.presidentDisplayName?.trim() || "",
    secretaryDisplayName: settings?.secretaryDisplayName?.trim() || "",
    authorizationText: buildCarnetAuthorizationText(
      name,
      settings?.carnetAuthorizationTemplate,
      { lddbiPreset: isLddbiCarnetPreset(theme.preset) },
    ),
    primaryRgb: theme.primaryRgb,
    accentRgb: theme.accentRgb,
    theme,
  };
}
