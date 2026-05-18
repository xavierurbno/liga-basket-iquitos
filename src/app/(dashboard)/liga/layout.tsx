import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { LigaOperationalNav } from "@/components/nav/LigaOperationalNav";
import { MasterClockCounter } from "@/components/system/MasterClockCounter";
import { SponsorFooter } from "@/components/layout/SponsorFooter";
import { hasIntranetAccess, intranetPortalNavLabel } from "@/lib/auth/intranet-roles";
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
      <header className="sticky top-0 z-20 border-b border-[#BFDBFE] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4">
          <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-slate-500">
            <MasterClockCounter />
          </div>
          <LigaOperationalNav
            userEmail={user.email ?? null}
            intranetNavLabel={intranetNavLabel}
          />
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <SponsorFooter />
    </div>
  );
}
