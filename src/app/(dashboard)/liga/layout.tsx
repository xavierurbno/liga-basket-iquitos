import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { OperationalAppHeader } from "@/components/layout/OperationalAppHeader";
import { getLigaOperationalContext } from "@/lib/auth/liga-operational-context";
import { hasIntranetAccess, intranetPortalNavLabel } from "@/lib/auth/intranet-roles";
import { resolveOperationalHeaderHomeHref } from "@/lib/portal/operational-header-home";
import type { Role } from "@/lib/auth/withAuth";

export const dynamic = "force-dynamic";

export default async function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {},
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const appRole = user.app_metadata?.role as Role | undefined;
  const intranetNavLabel = hasIntranetAccess(appRole) ? intranetPortalNavLabel(appRole) : null;
  const ctx = await getLigaOperationalContext();
  const headerHomeHref = await resolveOperationalHeaderHomeHref(ctx.activeLeagueSlug);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#F5F5F5]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-radial-[circle_at_top_right] from-blue-500/13 to-transparent to-35%"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-radial-[circle_at_bottom_left] from-blue-200/50 to-transparent to-45%"
        />
      </div>
      <OperationalAppHeader
        userEmail={user.email ?? null}
        intranetNavLabel={intranetNavLabel}
        activeLeagueId={ctx.leagueId}
        headerHomeHref={headerHomeHref}
      />
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-3 py-4 pb-8 sm:px-4 sm:py-6 sm:pb-10">{children}</main>
    </div>
  );
}
