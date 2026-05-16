import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Busqueda365Client } from "@/components/busqueda365/Busqueda365Client";
import { SiteTopNav } from "@/components/layout/SiteTopNav";

export const dynamic = "force-dynamic";

export default async function Busqueda365PublicPage() {
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
  const role = user?.app_metadata?.role as string | undefined;
  const showQuickStatusEdit = role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN";

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <SiteTopNav variant="busqueda365" />
      <div className="relative min-h-[80vh] p-4 sm:p-8">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,92,238,0.07),transparent_55%)]" />
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rotate-[-16deg] select-none whitespace-nowrap text-[min(18vw,160px)] font-black uppercase leading-none tracking-[0.12em] text-[#1e3a5f]/5">
            LIGA
          </div>
          <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 rotate-[-16deg] select-none whitespace-nowrap text-[min(11vw,96px)] font-black uppercase leading-none tracking-[0.25em] text-[#1e3a5f]/5">
            BASKET · IQUITOS
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl space-y-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1e3a5f]">Buscador 365</h1>
            <p className="mt-1 text-sm font-medium text-[#1e3a5f]/70">
              Descubre a los jugadores de la liga de manera global.
            </p>
          </div>
          <Busqueda365Client showQuickStatusEdit={showQuickStatusEdit} />
        </div>
      </div>
    </div>
  );
}
