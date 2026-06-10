/** Elige un club cuando el slug coincide; null si hay colisión multi-liga. */
export function pickClubFromSlugMatches<T extends { id: string }>(
  slug: string,
  matches: T[],
): T | null {
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0]!;
  console.warn(
    `[resolveClubBySlug] slug "${slug}" ambiguo (${matches.length} clubes); indica liga con cookie active_league_slug o query ?l=`,
  );
  return null;
}
