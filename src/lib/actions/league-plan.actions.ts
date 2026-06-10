"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withAuth, type AuthContext } from "@/lib/auth/withAuth";
import type { User } from "@supabase/supabase-js";
import { leaguePlanRepository } from "@/repositories/leaguePlanRepository";
import type { LeaguePlanTier } from "@/lib/db/schema";
import { parseDatetimeLocalInput } from "@/lib/leagues/datetime-local-input";

const updateLeaguePlanSchema = z.object({
  leagueId: z.string().uuid(),
  plan: z.enum(["free", "starter", "pro"]),
  maxPlayers: z.coerce.number().int().min(1).max(100_000),
  maxActiveTournaments: z.coerce.number().int().min(1).max(500),
  trialExpiresAt: z.string().optional(),
});

export type UpdateLeaguePlanState = {
  success?: boolean;
  error?: string;
  message?: string;
};

function parseTrialDate(raw: string | undefined): Date | null {
  return parseDatetimeLocalInput(raw);
}

export const updateLeaguePlanAction = withAuth(
  async (
    _prev: UpdateLeaguePlanState,
    formData: FormData,
    _user: User,
    _context: AuthContext,
  ): Promise<UpdateLeaguePlanState> => {
    const parsed = updateLeaguePlanSchema.safeParse({
      leagueId: formData.get("leagueId"),
      plan: formData.get("plan"),
      maxPlayers: formData.get("maxPlayers"),
      maxActiveTournaments: formData.get("maxActiveTournaments"),
      trialExpiresAt: formData.get("trialExpiresAt") || undefined,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
    }

    const { leagueId, plan, maxPlayers, maxActiveTournaments, trialExpiresAt } = parsed.data;

    try {
      await leaguePlanRepository.upsert(leagueId, {
        plan: plan as LeaguePlanTier,
        maxPlayers,
        maxActiveTournaments,
        trialExpiresAt: parseTrialDate(trialExpiresAt),
      });

      revalidatePath(`/super-admin/leagues/${leagueId}`);
      revalidatePath("/super-admin/leagues");

      return { success: true, message: "Plan y límites actualizados." };
    } catch (err) {
      console.error("[updateLeaguePlanAction]", err);
      return { success: false, error: "No se pudo guardar el plan." };
    }
  },
  "SUPER_ADMIN",
);
