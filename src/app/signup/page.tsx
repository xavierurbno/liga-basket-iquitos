import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPlatformName } from "@/lib/platform/platform-config";
import { listPublicPlans } from "@/lib/billing/plan-catalog";
import { isSignupEnabled, validateSignupAccess } from "@/lib/billing/signup-config";
import { SignupForm } from "@/components/billing/SignupForm";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ invite?: string }>;
};

export default async function SignupPage({ searchParams }: PageProps) {
  const { invite } = await searchParams;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/onboarding/league/");
  }

  const access = validateSignupAccess({ inviteToken: invite });
  const plans = listPublicPlans();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#F5F5F5] px-4 py-12">
      <div className="w-full max-w-3xl space-y-8">
        <header className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#005CEE]">
            {getPlatformName()}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Crea tu liga
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Registro self-service — el primer usuario será administrador de la liga.
          </p>
        </header>

        {!access.ok ? (
          <p className="rounded-2xl bg-amber-50 px-6 py-4 text-center text-sm font-medium text-amber-900">
            {access.error}
          </p>
        ) : (
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <SignupForm
              plans={plans}
              inviteToken={invite}
              signupEnabled={isSignupEnabled() && access.ok}
            />
          </div>
        )}
      </div>
    </div>
  );
}
