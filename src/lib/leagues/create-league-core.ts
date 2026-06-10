import { db } from "@/lib/db/client";
import { leagues, leagueSettings } from "@/lib/db/schema";
import { leaguePlanRepository } from "@/repositories/leaguePlanRepository";
import {
  getPlanDefinition,
  type BillingPlanTier,
} from "@/lib/billing/plan-catalog";
import {
  resolveNewLeagueSettingsDefaults,
  type NewLeagueKind,
} from "@/lib/leagues/resolve-new-league-settings-defaults";

export type CreateLeagueCoreInput = {
  name: string;
  slug: string;
  seasonName?: string;
  leagueKind?: NewLeagueKind;
  planTier?: BillingPlanTier;
  trialDays?: number;
};

export type CreateLeagueCoreResult =
  | { success: true; leagueId: string; slug: string }
  | { success: false; error: string; code?: "duplicate_slug" };

export async function createLeagueCore(
  input: CreateLeagueCoreInput,
): Promise<CreateLeagueCoreResult> {
  try {
    const seasonName =
      input.seasonName?.trim() || `Temporada ${new Date().getFullYear()}`;
    const leagueKind: NewLeagueKind = input.leagueKind ?? "tournament";
    const planTier: BillingPlanTier = input.planTier ?? "free";
    const planDef = getPlanDefinition(planTier);

    const [newLeague] = await db
      .insert(leagues)
      .values({
        name: input.name.trim(),
        slug: input.slug.trim(),
      })
      .returning();

    const settingsDefaults = resolveNewLeagueSettingsDefaults(
      newLeague.slug,
      newLeague.name,
      leagueKind,
    );

    await db.insert(leagueSettings).values({
      leagueId: newLeague.id,
      seasonName,
      carnetThemePreset: settingsDefaults.carnetThemePreset,
      carnetShowFederation: settingsDefaults.carnetShowFederation,
      carnetSignatureMode: settingsDefaults.carnetSignatureMode,
      documentSerialPrefix: settingsDefaults.documentSerialPrefix,
    });

    const trialDays = input.trialDays ?? planDef.trialDays;
    const trialExpiresAt =
      trialDays > 0
        ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
        : null;

    await leaguePlanRepository.upsert(newLeague.id, {
      plan: planTier,
      maxPlayers: planDef.maxPlayers,
      maxActiveTournaments: planDef.maxActiveTournaments,
      trialExpiresAt,
    });

    return { success: true, leagueId: newLeague.id, slug: newLeague.slug };
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : undefined;
    if (code === "23505") {
      return { success: false, error: "El slug ya está en uso.", code: "duplicate_slug" };
    }
    console.error("[createLeagueCore]", error);
    return { success: false, error: "No se pudo crear la liga." };
  }
}
