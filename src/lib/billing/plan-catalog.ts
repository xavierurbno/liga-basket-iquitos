import type { LeaguePlanTier } from "@/lib/db/schema";

export type BillingPlanTier = LeaguePlanTier;

export type PlanDefinition = {
  tier: BillingPlanTier;
  label: string;
  description: string;
  maxPlayers: number;
  maxActiveTournaments: number;
  /** Price ID mensual en Stripe; null = sin cobro */
  stripePriceId: string | null;
  trialDays: number;
  highlighted?: boolean;
};

function priceId(envKey: string): string | null {
  const v = process.env[envKey]?.trim();
  return v || null;
}

/** Catálogo comercial Free / Starter / Pro (Fase 6). */
export const PLAN_CATALOG: Record<BillingPlanTier, PlanDefinition> = {
  free: {
    tier: "free",
    label: "Free",
    description: "Ideal para probar la plataforma con una liga pequeña.",
    maxPlayers: 200,
    maxActiveTournaments: 2,
    stripePriceId: null,
    trialDays: 14,
  },
  starter: {
    tier: "starter",
    label: "Starter",
    description: "Para ligas en crecimiento con más equipos y torneos.",
    maxPlayers: 500,
    maxActiveTournaments: 5,
    stripePriceId: priceId("STRIPE_PRICE_STARTER"),
    trialDays: 0,
    highlighted: true,
  },
  pro: {
    tier: "pro",
    label: "Pro",
    description: "Capacidad ampliada para ligas federadas o multi-torneo.",
    maxPlayers: 2000,
    maxActiveTournaments: 20,
    stripePriceId: priceId("STRIPE_PRICE_PRO"),
    trialDays: 0,
  },
};

export function getPlanDefinition(tier: BillingPlanTier): PlanDefinition {
  return PLAN_CATALOG[tier];
}

export function isPaidPlan(tier: BillingPlanTier): boolean {
  const def = getPlanDefinition(tier);
  return Boolean(def.stripePriceId);
}

export function resolveTierFromStripePriceId(priceId: string): BillingPlanTier | null {
  for (const def of Object.values(PLAN_CATALOG)) {
    if (def.stripePriceId === priceId) return def.tier;
  }
  return null;
}

export function listPublicPlans(): PlanDefinition[] {
  return Object.values(PLAN_CATALOG);
}
