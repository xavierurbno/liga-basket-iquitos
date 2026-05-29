/** Extrae `clubId` del primer argumento de una server action (FormData u objeto tipado). */
export function extractClubIdFromActionArgs(args: unknown[]): string | undefined {
  const first = args[0];
  if (first instanceof FormData) {
    const raw = first.get("clubId");
    return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
  }
  if (first && typeof first === "object" && "clubId" in first) {
    const raw = (first as { clubId?: unknown }).clubId;
    return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
  }
  return undefined;
}
