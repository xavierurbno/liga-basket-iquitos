"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { assertTransferPeriodOpen } from "@/lib/transfer-period";
import { ActionResult, LeagueSettings } from "@/lib/types/league";
import { getCachedLeagueSettings } from "@/lib/data/cached-queries";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { settingsRepository } from "@/repositories/settingsRepository";
import { User } from "@supabase/supabase-js";
import { formatActionError } from "@/lib/actions/system-dashboard-helpers";

export async function getTransferStatusAction(): Promise<{
  isOpen: boolean;
  message: string;
  start?: Date | null;
  end?: Date | null;
  isManualOverride?: boolean;
}> {
  const status = await assertTransferPeriodOpen();
  const settings = await getCachedLeagueSettings();

  return {
    isOpen: status.success,
    message: status.error || "El periodo de transferencias está abierto.",
    start: settings?.transferPeriodStart,
    end: settings?.transferPeriodEnd,
    isManualOverride: settings?.isManualOverride ?? false,
  };
}

export const toggleTransferOverrideAction = withAuth(
  async (newState: boolean, _user: User, _context: AuthContext): Promise<ActionResult> => {
    await settingsRepository.toggleOverride(newState);
    revalidateTag("league-settings", "max");
    revalidatePath("/liga/", "page" as any);
    revalidatePath("/", "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"],
);

export async function getLeagueSettingsAction(): Promise<LeagueSettings> {
  try {
    const settings = await getCachedLeagueSettings();
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
  async (): Promise<ActionResult> => {
    try {
      const existing = await settingsRepository.getSettings();
      if (existing) return { success: true };

      await settingsRepository.upsert({
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
