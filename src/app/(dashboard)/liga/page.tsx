import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { LigaHubCardGrid } from "@/components/nav/LigaHubCardGrid";
import type { Role } from "@/lib/auth/withAuth";

export const dynamic = "force-dynamic";

export default async function LigaOperationalHubPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {},
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.app_metadata?.role as Role | undefined;
  const viewerSegment = role === "CLUB_DELEGATE" ? "delegate" : "staff";
  const showProfilesCard = role === "SUPER_ADMIN" || role === "LEAGUE_ADMIN";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500">PANEL OPERATIVO</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#0f2040]">Gestión de la liga</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          {viewerSegment === "delegate"
            ? "Como delegado gestionas el club que te asignó la administración (categorías, fichas) y puedes consultar jugadores en Búsqueda 365."
            : "Accede a clubes, categorías, tesorería y herramientas administrativas. Usa las tarjetas de abajo para abrir cada módulo."}
        </p>
      </div>

      <LigaHubCardGrid viewerSegment={viewerSegment} showProfilesCard={showProfilesCard} />
    </div>
  );
}
