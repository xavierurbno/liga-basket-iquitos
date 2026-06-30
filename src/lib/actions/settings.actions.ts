"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { assertTransferPeriodOpen } from "@/lib/transfer-period";
import { ActionResult } from "@/lib/types/league";
import { getCachedLeagueSettings } from "@/lib/data/cached-queries";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { settingsRepository } from "@/repositories/settingsRepository";
import { resolveLeagueSettingsScopeId } from "@/lib/leagues/resolve-league-settings-scope.server";
import { isValidUuid } from "@/lib/db/public-read-guards";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";
import { User } from "@supabase/supabase-js";
import { withOperationalWrite, unauthenticatedReadDb } from "@/lib/db/operational-db-access";

/** Campos expuestos sin autenticación (portal / reloj de mercado de pases). */
export type PublicLeagueSettings = {
  transferPeriodStart?: Date | null;
  transferPeriodEnd?: Date | null;
  isManualOverride?: boolean;
  bannerText?: string | null;
};

async function gatePublicLeagueSettingsRead(
  leagueId?: string | null,
): Promise<{ ok: true; scopedId: string | null } | { ok: false; error: string }> {
  const rateError = await enforceRateLimit("settingsPublic");
  if (rateError) return { ok: false, error: rateError };

  const explicit = leagueId?.trim();
  if (explicit && !isValidUuid(explicit)) {
    return { ok: false, error: "Identificador de liga no válido." };
  }

  const scopedId = await resolveLeagueSettingsScopeId(leagueId);
  return { ok: true, scopedId };
}

export async function getTransferStatusAction(
  leagueId?: string | null,
): Promise<{
  isOpen: boolean;
  message: string;
  start?: Date | null;
  end?: Date | null;
  isManualOverride?: boolean;
}> {
  const gate = await gatePublicLeagueSettingsRead(leagueId);
  if (!gate.ok) {
    return { isOpen: false, message: gate.error };
  }

  const status = await assertTransferPeriodOpen(null, gate.scopedId);
  const settings = await getCachedLeagueSettings(gate.scopedId);

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
    user: User,
    context: AuthContext,
  ): Promise<ActionResult> => {
    const leagueId = context.leagueId?.trim();
    if (!leagueId) {
      return {
        success: false,
        error: "Selecciona una liga activa antes de cambiar el mercado de pases.",
      };
    }

    await withOperationalWrite(user, context, async (tx) => {
      await settingsRepository.updateLeagueSettings(
        leagueId,
        { isManualOverride: newState },
        tx,
      );
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
): Promise<PublicLeagueSettings> {
  try {
    const gate = await gatePublicLeagueSettingsRead(leagueId);
    if (!gate.ok || !gate.scopedId) return {};

    const settings = await settingsRepository.getLeagueSettings(
      gate.scopedId,
      unauthenticatedReadDb(),
    );
    if (!settings) return {};

    return {
      transferPeriodStart: settings.transferPeriodStart,
      transferPeriodEnd: settings.transferPeriodEnd,
      isManualOverride: settings.isManualOverride ?? false,
      bannerText: settings.bannerText,
    };
  } catch {
    return {};
  }
}

export const seedLeagueSettingsAction = withAuth(
  async (user: User, context: AuthContext): Promise<ActionResult> => {
    try {
      const leagueId = context.leagueId?.trim();
      if (!leagueId) {
        return { success: false, error: "Selecciona una liga activa." };
      }

      await withOperationalWrite(user, context, async (tx) => {
        const existing = await settingsRepository.getLeagueSettings(leagueId, tx);
        if (existing) return;

        await settingsRepository.updateLeagueSettings(
          leagueId,
          {
            transferPeriodStart: null,
            transferPeriodEnd: null,
            bannerText: "El Mercado de Pases está cerrado temporalmente.",
            isManualOverride: false,
          },
          tx,
        );
      });

      revalidateTag("league-settings", "max");
      return { success: true };
    } catch (error) {
      return { success: false, error: formatActionError(error) };
    }
  },
  "SUPER_ADMIN",
);
