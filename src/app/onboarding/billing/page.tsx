import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readUserRole } from "@/lib/auth/read-user-role";
import { getPlanDefinition, isPaidPlan } from "@/lib/billing/plan-catalog";
import { resolveSelectedPlanTier } from "@/lib/actions/billing.actions";
import { leaguePlanRepository } from "@/repositories/leaguePlanRepository";
import { BillingCheckoutPanel } from "@/components/billing/BillingCheckoutPanel";
import { isStripeConfigured } from "@/lib/stripe/stripe-server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ success?: string; canceled?: string }>;
};

export default async function OnboardingBillingPage({ searchParams }: PageProps) {
  const { success, canceled } = await searchParams;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signup/");

  const leagueId = user.app_metadata?.league_id as string | undefined;
  if (!leagueId) redirect("/onboarding/league/");

  const tier = await resolveSelectedPlanTier();
  if (!isPaidPlan(tier)) {
    redirect("/liga/");
  }

  if (!isStripeConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-slate-600">
          Stripe no está configurado en este entorno. Contacta soporte para activar tu plan.
        </p>
      </div>
    );
  }

  const plan = await leaguePlanRepository.findByLeagueId(leagueId);
  const planDef = getPlanDefinition(tier);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[#F5F5F5] px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <header className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#005CEE]">
            Paso 3 de 3
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">Activa tu suscripción</h1>
        </header>
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <BillingCheckoutPanel
            leagueId={leagueId}
            planLabel={planDef.label}
            hasSubscription={Boolean(plan?.stripeSubscriptionId)}
            success={success === "1"}
            canceled={canceled === "1"}
          />
        </div>
      </div>
    </div>
  );
}
