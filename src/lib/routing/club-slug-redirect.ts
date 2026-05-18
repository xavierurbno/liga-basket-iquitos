/**
 * Redirige rutas legacy `/{clubSlug}/...` al panel oficial en `/liga/clubs/...`.
 */
export function resolveClubSlugRedirectPath(
  clubId: string,
  restSegments: string[] | undefined,
): string {
  const rest = restSegments ?? [];
  const head = rest[0]?.toLowerCase();

  switch (head) {
    case "caja":
      return "/liga/tesoreria/";
    case "torneos":
      return "/liga/torneos/";
    case "configuracion":
    case "jugadores":
      return `/liga/clubs/${clubId}/`;
    default:
      return `/liga/clubs/${clubId}/`;
  }
}
