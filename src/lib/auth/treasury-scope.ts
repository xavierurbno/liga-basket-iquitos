export type TreasuryAccess =
  | {
      kind: "full";
      clubIds: null;
    }
  | {
      kind: "readonly";
      clubIds: string[];
    }
  | { kind: "none" };

export function assertClubScopeForRead(
  access: TreasuryAccess,
  filterClubId: string | null,
): { clubIds: string[] | null } {
  if (access.kind === "none") return { clubIds: [] };
  if (access.kind === "full") {
    if (filterClubId) return { clubIds: [filterClubId] };
    return { clubIds: null };
  }
  if (filterClubId && !access.clubIds.includes(filterClubId)) {
    return { clubIds: [] };
  }
  if (filterClubId) return { clubIds: [filterClubId] };
  return { clubIds: access.clubIds };
}
