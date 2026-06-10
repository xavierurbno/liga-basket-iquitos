import type { AuthContext } from "@/lib/auth/withAuth";
import { leaguePlanRepository } from "@/repositories/leaguePlanRepository";
import { BILLING_UPGRADE_PATH } from "@/lib/billing/signup-config";
import { isStripeConfigured } from "@/lib/stripe/stripe-server";

export const LEAGUE_PLAN_LIMIT_MESSAGE =
  "Has alcanzado el límite de tu plan. Contacta al administrador de la plataforma para ampliar tu plan.";

export const LEAGUE_PLAN_TRIAL_EXPIRED_MESSAGE =
  "Tu periodo de prueba ha finalizado. Amplía tu plan para seguir operando.";

export type PlanLimitBlock = {
  message: string;
  upgradePath: string | null;
  code: "max_players" | "max_tournaments" | "trial_expired";
};

function bypassPlanLimits(context: AuthContext): boolean {
  return context.role === "SUPER_ADMIN";
}

function upgradePathFor(context: AuthContext): string | null {
  if (context.role === "SUPER_ADMIN") return null;
  return isStripeConfigured() ? BILLING_UPGRADE_PATH : null;
}

function limitMessage(code: PlanLimitBlock["code"]): string {
  if (isStripeConfigured()) {
    if (code === "trial_expired") return LEAGUE_PLAN_TRIAL_EXPIRED_MESSAGE;
    return "Has alcanzado el límite de tu plan. Amplía tu suscripción para continuar.";
  }
  return LEAGUE_PLAN_LIMIT_MESSAGE;
}

async function evaluateTrialOnly(
  leagueId: string,
  context: AuthContext,
): Promise<PlanLimitBlock | null> {
  if (bypassPlanLimits(context)) return null;
  const usage = await leaguePlanRepository.getUsage(leagueId);
  if (
    usage.plan.trialExpiresAt &&
    new Date(usage.plan.trialExpiresAt).getTime() < Date.now() &&
    usage.plan.plan === "free"
  ) {
    return {
      code: "trial_expired",
      message: limitMessage("trial_expired"),
      upgradePath: upgradePathFor(context),
    };
  }
  return null;
}

export async function assertCanRegisterPlayer(
  leagueId: string,
  context: AuthContext,
): Promise<PlanLimitBlock | null> {
  const usage = await leaguePlanRepository.getUsage(leagueId);
  if (bypassPlanLimits(context)) return null;

  const upgradePath = upgradePathFor(context);

  if (
    usage.plan.trialExpiresAt &&
    new Date(usage.plan.trialExpiresAt).getTime() < Date.now() &&
    usage.plan.plan === "free"
  ) {
    return {
      code: "trial_expired",
      message: limitMessage("trial_expired"),
      upgradePath,
    };
  }

  if (usage.playerCount >= usage.plan.maxPlayers) {
    return {
      code: "max_players",
      message: limitMessage("max_players"),
      upgradePath,
    };
  }

  return null;
}

export async function assertCanCreateTournament(
  leagueId: string,
  context: AuthContext,
): Promise<PlanLimitBlock | null> {
  if (bypassPlanLimits(context)) return null;

  const usage = await leaguePlanRepository.getUsage(leagueId);
  const upgradePath = upgradePathFor(context);

  if (
    usage.plan.trialExpiresAt &&
    new Date(usage.plan.trialExpiresAt).getTime() < Date.now() &&
    usage.plan.plan === "free"
  ) {
    return {
      code: "trial_expired",
      message: limitMessage("trial_expired"),
      upgradePath,
    };
  }

  if (usage.activeTournamentCount >= usage.plan.maxActiveTournaments) {
    return {
      code: "max_tournaments",
      message: limitMessage("max_tournaments"),
      upgradePath,
    };
  }

  return null;
}

/** Evalúa trial expirado (dashboard / avisos). */
export async function evaluateLeaguePlanAccess(
  leagueId: string,
  context: AuthContext,
): Promise<PlanLimitBlock | null> {
  return evaluateTrialOnly(leagueId, context);
}
