import type Stripe from "stripe";
import { leaguePlanRepository } from "@/repositories/leaguePlanRepository";
import {
  getPlanDefinition,
  resolveTierFromStripePriceId,
  type BillingPlanTier,
} from "@/lib/billing/plan-catalog";

export async function applyPlanTierToLeague(
  leagueId: string,
  tier: BillingPlanTier,
  extras?: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    trialExpiresAt?: Date | null;
  },
) {
  const def = getPlanDefinition(tier);
  return leaguePlanRepository.upsertFromStripe(leagueId, {
    plan: tier,
    maxPlayers: def.maxPlayers,
    maxActiveTournaments: def.maxActiveTournaments,
    stripeCustomerId: extras?.stripeCustomerId ?? undefined,
    stripeSubscriptionId: extras?.stripeSubscriptionId ?? undefined,
    trialExpiresAt: extras?.trialExpiresAt,
  });
}

export async function syncLeaguePlanFromSubscription(
  subscription: Stripe.Subscription,
): Promise<{ leagueId: string | null; tier: BillingPlanTier | null }> {
  const leagueId =
    subscription.metadata?.league_id?.trim() ||
    subscription.metadata?.leagueId?.trim() ||
    null;

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const tier = priceId ? resolveTierFromStripePriceId(priceId) : null;

  if (!leagueId || !tier) {
    return { leagueId, tier };
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  await applyPlanTierToLeague(leagueId, tier, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    trialExpiresAt: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null,
  });

  return { leagueId, tier };
}

export async function downgradeLeagueToFree(leagueId: string) {
  return applyPlanTierToLeague(leagueId, "free", {
    stripeSubscriptionId: null,
  });
}

export async function syncFromCheckoutSession(session: Stripe.Checkout.Session) {
  const leagueId = session.metadata?.league_id?.trim();
  if (!leagueId) return { leagueId: null as string | null };

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  if (subscriptionId) {
    return { leagueId, subscriptionId, customerId };
  }

  const tierRaw = session.metadata?.plan_tier as BillingPlanTier | undefined;
  if (tierRaw) {
    await applyPlanTierToLeague(leagueId, tierRaw, {
      stripeCustomerId: customerId,
    });
  }

  return { leagueId, subscriptionId, customerId };
}
