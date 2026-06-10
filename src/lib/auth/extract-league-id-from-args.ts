/** Extrae `leagueId` del primer argumento de una server action (FormData u objeto tipado). */
export function extractLeagueIdFromActionArgs(args: unknown[]): string | undefined {
  const first = args[0];
  if (first instanceof FormData) {
    const raw = first.get("leagueId");
    return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
  }
  if (first && typeof first === "object" && "leagueId" in first) {
    const raw = (first as { leagueId?: unknown }).leagueId;
    return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
  }
  return undefined;
}
