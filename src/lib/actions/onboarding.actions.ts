"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readUserRole } from "@/lib/auth/read-user-role";
import { createLeagueCore } from "@/lib/leagues/create-league-core";
import { linkUserAsLeagueAdmin } from "@/lib/leagues/link-league-owner";
import {
  persistActiveLeagueContext,
  revalidateActiveLeaguePaths,
} from "@/lib/auth/set-active-league-cookie";
import { revalidateLeaguePortalBySlug } from "@/lib/portal/revalidate-league-portal";
import {
  ONBOARDING_PLAN_COOKIE,
  validateSignupAccess,
} from "@/lib/billing/signup-config";
import {
  resolveSelectedPlanTier,
  shouldRedirectToBilling,
} from "@/lib/actions/billing.actions";
import { isPaidPlan } from "@/lib/billing/plan-catalog";
import type { NewLeagueKind } from "@/lib/leagues/resolve-new-league-settings-defaults";

const onboardingLeagueSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug inválido"),
  seasonName: z.string().max(120).optional(),
  leagueKind: z.enum(["federated", "tournament"]).optional(),
});

export type OnboardingLeagueState = {
  success?: boolean;
  error?: string;
  errors?: Record<string, string[]>;
  leagueId?: string;
};

export async function createLeagueOnboardingAction(
  _prev: OnboardingLeagueState,
  formData: FormData,
): Promise<OnboardingLeagueState> {
  const access = validateSignupAccess();
  if (!access.ok) return { success: false, error: access.error };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { success: false, error: "Debes iniciar sesión para continuar." };
  }

  const role = readUserRole(user);
  if (role && role !== "LEAGUE_ADMIN") {
    return { success: false, error: "Tu cuenta ya tiene un rol asignado." };
  }
  if (role === "LEAGUE_ADMIN" && user.app_metadata?.league_id) {
    redirect("/liga/");
  }

  const parsed = onboardingLeagueSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    seasonName: formData.get("seasonName") || undefined,
    leagueKind: (formData.get("leagueKind") as NewLeagueKind | null) || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "Revisa los datos de la liga.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const planTier = await resolveSelectedPlanTier();
  const fullName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email.split("@")[0];

  const created = await createLeagueCore({
    name: parsed.data.name,
    slug: parsed.data.slug,
    seasonName: parsed.data.seasonName,
    leagueKind: parsed.data.leagueKind,
    planTier,
  });

  if (!created.success) {
    return {
      success: false,
      error: created.error,
      errors: created.code === "duplicate_slug" ? { slug: [created.error] } : undefined,
    };
  }

  const linked = await linkUserAsLeagueAdmin({
    userId: user.id,
    leagueId: created.leagueId,
    fullName,
  });
  if (!linked.success) {
    return { success: false, error: linked.error };
  }

  await persistActiveLeagueContext(user.id, created.leagueId);
  revalidateActiveLeaguePaths();
  revalidateLeaguePortalBySlug(created.slug);

  const cookieStore = await cookies();
  if (isPaidPlan(planTier)) {
    redirect("/onboarding/billing/");
  }

  cookieStore.delete(ONBOARDING_PLAN_COOKIE);
  redirect("/liga/");
}

export async function completeFreeOnboardingAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ONBOARDING_PLAN_COOKIE);
  redirect("/liga/");
}

export async function getOnboardingBillingContext(leagueId: string) {
  const tier = await resolveSelectedPlanTier();
  const needsBilling = await shouldRedirectToBilling(leagueId);
  return { tier, needsBilling, isPaid: isPaidPlan(tier) };
}
