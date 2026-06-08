"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { assertTransferPeriodOpen } from "@/lib/transfer-period";
import { ActionResult, LeagueSettings } from "@/lib/types/league";
import { getCachedLeagueSettings } from "@/lib/data/cached-queries";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { settingsRepository } from "@/repositories/settingsRepository";
import { resolveLeagueSettingsScopeId } from "@/lib/leagues/resolve-league-settings-scope.server";
import { User } from "@supabase/supabase-js";
import { formatActionError } from "@/lib/actions/system-dashboard-helpers";

export async function getTransferStatusAction(
  leagueId?: string | null,
): Promise<{
  isOpen: boolean;
  message: string;
  start?: Date | null;
  end?: Date | null;
  isManualOverride?: boolean;
}> {
  const scopedId = await resolveLeagueSettingsScopeId(leagueId);
  const status = await assertTransferPeriodOpen(null, scopedId);
  const settings = await getCachedLeagueSettings(scopedId);

  return {
    isOpen: status.success,
    message: status.error || "El periodo de transferencias está abierto.",
    start: settings?.transferPeriodStart,
    end: settings?.transferPeriodEnd,
    isManualOverride: settings?.isManualOverride ?? false,
  };
}

export const toggleTransferOverrideAction = withAuth(
  async (
    newState: boolean,
    _user: User,
    context: AuthContext,
  ): Promise<ActionResult> => {
    const leagueId = context.leagueId?.trim();
    if (!leagueId) {
      return {
        success: false,
        error: "Selecciona una liga activa antes de cambiar el mercado de pases.",
      };
    }

    await settingsRepository.updateLeagueSettings(leagueId, {
      isManualOverride: newState,
    });
    revalidateTag("league-settings", "max");
    revalidatePath("/liga/", "page" as any);
    revalidatePath("/", "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"],
);

export async function getLeagueSettingsAction(
  leagueId?: string | null,
): Promise<LeagueSettings> {
  try {
    const scopedId = await resolveLeagueSettingsScopeId(leagueId);
    const settings = scopedId
      ? await settingsRepository.getLeagueSettings(scopedId)
      : null;
    if (!settings) return {};
    return {
      id: settings.id,
      transferPeriodStart: settings.transferPeriodStart,
      transferPeriodEnd: settings.transferPeriodEnd,
      bannerText: settings.bannerText,
      isManualOverride: settings.isManualOverride ?? false,
    } as LeagueSettings;
  } catch {
    return {};
  }
}

export const seedLeagueSettingsAction = withAuth(
  async (_user: User, context: AuthContext): Promise<ActionResult> => {
    try {
      const leagueId = context.leagueId?.trim();
      if (!leagueId) {
        return { success: false, error: "Selecciona una liga activa." };
      }

      const existing = await settingsRepository.getLeagueSettings(leagueId);
      if (existing) return { success: true };

      await settingsRepository.updateLeagueSettings(leagueId, {
        transferPeriodStart: null,
        transferPeriodEnd: null,
        bannerText: "El Mercado de Pases está cerrado temporalmente.",
        isManualOverride: false,
      });

      revalidateTag("league-settings", "max");
      return { success: true };
    } catch (error) {
      return { success: false, error: formatActionError(error) };
    }
  },
  "SUPER_ADMIN",
);
