/** Plantilla por defecto del reverso del carnet (placeholder `{ligaNombre}`). */
export const DEFAULT_CARNET_AUTHORIZATION_TEMPLATE =
  "La Liga Deportiva Distrital de {ligaNombre} autoriza a la persona identificada mediante el presente carnet a ingresar a los espectáculos que se realicen dentro de la ciudad.";

/** Reverso LDDBI — sin duplicar el nombre de la liga en el texto. */
export const DEFAULT_LDDBI_CARNET_AUTHORIZATION_TEMPLATE =
  "La Liga Deportiva Distrital de Basket de Iquitos autoriza a la persona identificada mediante el presente carnet a ingresar y participar en los torneos y actividades deportivas autorizados por esta liga dentro de la ciudad.";

export function buildCarnetAuthorizationText(
  leagueDisplayName: string,
  template?: string | null,
  options?: { lddbiPreset?: boolean },
): string {
  const nombre = leagueDisplayName.trim() || "la liga";
  const defaultTpl = options?.lddbiPreset
    ? DEFAULT_LDDBI_CARNET_AUTHORIZATION_TEMPLATE
    : DEFAULT_CARNET_AUTHORIZATION_TEMPLATE;
  const raw = template?.trim() || defaultTpl;
  if (raw.includes("{ligaNombre}")) {
    return raw.replace(/\{ligaNombre\}/g, nombre);
  }
  return raw;
}

export function resolveCarnetValidityLabel(
  carnetValidityLabel?: string | null,
  seasonName?: string | null,
): string {
  const manual = carnetValidityLabel?.trim();
  if (manual) return manual;
  const season = seasonName?.trim();
  if (season) return season;
  const year = new Date().getFullYear();
  return `Vigencia ${year}`;
}

/** Separa apellidos para el anverso (P. / M.) sin columnas extra en BD. */
export function splitApellidosParaCarnet(lastname: string): {
  apellidoPaterno: string;
  apellidoMaterno: string;
} {
  const parts = lastname.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { apellidoPaterno: "—", apellidoMaterno: "—" };
  }
  if (parts.length === 1) {
    return { apellidoPaterno: parts[0].toUpperCase(), apellidoMaterno: "—" };
  }
  return {
    apellidoPaterno: parts[0].toUpperCase(),
    apellidoMaterno: parts.slice(1).join(" ").toUpperCase(),
  };
}

export function formatGeneroCarnet(
  gender: "MASCULINO" | "FEMENINO" | "MIXTO",
): string {
  if (gender === "MASCULINO") return "M";
  if (gender === "FEMENINO") return "F";
  return "MIXTO";
}

/** Etiqueta impresa en carnet físico (p. ej. DAMAS / VARONES). */
export function formatGeneroCarnetEtiqueta(
  gender: "MASCULINO" | "FEMENINO" | "MIXTO",
): string {
  if (gender === "FEMENINO") return "DAMAS";
  if (gender === "MASCULINO") return "VARONES";
  return "MIXTO";
}
