import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readUserRole } from "@/lib/auth/read-user-role";
import { getPlanDefinition } from "@/lib/billing/plan-catalog";
import { resolveSelectedPlanTier } from "@/lib/actions/billing.actions";
import { OnboardingLeagueForm } from "@/components/billing/OnboardingLeagueForm";

export const dynamic = "force-dynamic";

export default async function OnboardingLeaguePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signup/");
  }

  const role = readUserRole(user);
  if (role === "LEAGUE_ADMIN" && user.app_metadata?.league_id) {
    redirect("/liga/");
  }
  if (role && role !== "LEAGUE_ADMIN") {
    redirect("/liga/");
  }

  const tier = await resolveSelectedPlanTier();
  const plan = getPlanDefinition(tier);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#F5F5F5] px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <header className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#005CEE]">
            Paso 2 de 3
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-900">Configura tu liga</h1>
        </header>
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <OnboardingLeagueForm planLabel={plan.label} />
        </div>
      </div>
    </div>
  );
}
