"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/enforce-rate-limit";
import {
  getPlanDefinition,
  isPaidPlan,
  type BillingPlanTier,
} from "@/lib/billing/plan-catalog";
import {
  ONBOARDING_PLAN_COOKIE,
  ONBOARDING_PLAN_COOKIE_MAX_AGE,
  validateSignupAccess,
  validateSignupEmail,
} from "@/lib/billing/signup-config";
import { getStripe, getAppBaseUrl, isStripeConfigured } from "@/lib/stripe/stripe-server";
import { leaguePlanRepository } from "@/repositories/leaguePlanRepository";
import { readUserRole } from "@/lib/auth/read-user-role";

const tierSchema = z.enum(["free", "starter", "pro"]);

export type SignupActionState = {
  success?: boolean;
  error?: string;
};

export async function signupWithPlanAction(
  _prev: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const rateError = await enforceRateLimit("login");
  if (rateError) return { success: false, error: rateError };

  const access = validateSignupAccess({
    inviteToken: formData.get("inviteToken")?.toString(),
  });
  if (!access.ok) return { success: false, error: access.error };

  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const fullName = formData.get("fullName")?.toString().trim() ?? "";
  const planRaw = formData.get("plan")?.toString();

  const emailCheck = validateSignupEmail(email);
  if (!emailCheck.ok) return { success: false, error: emailCheck.error };

  const parsedPlan = tierSchema.safeParse(planRaw);
  if (!parsedPlan.success) {
    return { success: false, error: "Selecciona un plan válido." };
  }

  if (password.length < 8) {
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (fullName.length < 3) {
    return { success: false, error: "Indica tu nombre completo." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${getAppBaseUrl()}/auth/callback/?next=/onboarding/league/`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: "No se pudo crear la cuenta." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ONBOARDING_PLAN_COOKIE, parsedPlan.data, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONBOARDING_PLAN_COOKIE_MAX_AGE,
  });

  redirect("/onboarding/league/");
}

export type CreateCheckoutState = {
  success?: boolean;
  error?: string;
  url?: string;
};

export async function createStripeCheckoutAction(input?: {
  leagueId?: string;
  planTier?: BillingPlanTier;
}): Promise<CreateCheckoutState> {
  if (!isStripeConfigured()) {
    return { success: false, error: "Stripe no está configurado." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { success: false, error: "Debes iniciar sesión." };
  }

  const role = readUserRole(user);
  if (role !== "LEAGUE_ADMIN" && role !== "SUPER_ADMIN") {
    return { success: false, error: "Solo administradores de liga pueden gestionar la suscripción." };
  }

  const leagueId = input?.leagueId ?? (user.app_metadata?.league_id as string | undefined);
  if (!leagueId) {
    return { success: false, error: "No se encontró la liga activa." };
  }

  const cookieStore = await cookies();
  const planFromCookie = cookieStore.get(ONBOARDING_PLAN_COOKIE)?.value;
  const tierParsed = tierSchema.safeParse(input?.planTier ?? planFromCookie);
  const tier: BillingPlanTier = tierParsed.success ? tierParsed.data : "starter";

  const planDef = getPlanDefinition(tier);
  if (!planDef.stripePriceId) {
    return { success: false, error: "Este plan no requiere pago." };
  }

  const stripe = getStripe();
  const base = getAppBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: planDef.stripePriceId, quantity: 1 }],
    success_url: `${base}/onboarding/billing/?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/onboarding/billing/?canceled=1`,
    metadata: {
      league_id: leagueId,
      plan_tier: tier,
      user_id: user.id,
    },
    subscription_data: {
      metadata: {
        league_id: leagueId,
        plan_tier: tier,
      },
    },
  });

  if (!session.url) {
    return { success: false, error: "Stripe no devolvió URL de checkout." };
  }

  return { success: true, url: session.url };
}

export async function createStripePortalAction(): Promise<CreateCheckoutState> {
  if (!isStripeConfigured()) {
    return { success: false, error: "Stripe no está configurado." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Debes iniciar sesión." };

  const leagueId = user.app_metadata?.league_id as string | undefined;
  if (!leagueId) {
    return { success: false, error: "No se encontró la liga." };
  }

  const plan = await leaguePlanRepository.findByLeagueId(leagueId);
  if (!plan?.stripeCustomerId) {
    return { success: false, error: "Esta liga no tiene cliente Stripe." };
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: plan.stripeCustomerId,
    return_url: `${getAppBaseUrl()}/liga/`,
  });

  return { success: true, url: portal.url };
}

export async function resolveSelectedPlanTier(): Promise<BillingPlanTier> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ONBOARDING_PLAN_COOKIE)?.value;
  const parsed = tierSchema.safeParse(raw);
  return parsed.success ? parsed.data : "free";
}

export async function shouldRedirectToBilling(leagueId: string): Promise<boolean> {
  const tier = await resolveSelectedPlanTier();
  if (!isPaidPlan(tier)) return false;
  const plan = await leaguePlanRepository.findByLeagueId(leagueId);
  return !plan?.stripeSubscriptionId;
}
