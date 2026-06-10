export interface LeagueSettings {
  id?: string;
  transferPeriodStart?: Date | string | null;
  transferPeriodEnd?: Date | string | null;
  bannerText?: string | null;
  isManualOverride?: boolean;
}

export type ActionResult =
  | { success: true; clubSlug?: string; clubId?: string }
  | { success: false; error: string; upgradePath?: string | null };
