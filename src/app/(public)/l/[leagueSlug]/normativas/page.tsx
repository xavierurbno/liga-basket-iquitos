import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { PortalSiteHeaderBar, resolvePortalPanelHref } from "@/components/layout/PortalSiteHeader";
import { NormativaUploadForm } from "@/components/normativas/NormativaUploadForm";
import { NormativasPublicSection } from "@/components/normativas/NormativasPublicSection";
import { loadPublicNormativasForLeague } from "@/lib/normativas/load-public-normativas";
import { fetchPortalLeagueBySlug } from "@/lib/portal/portal-league-cache";
import { leaguePortalHome } from "@/lib/portal/league-portal-paths";
import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";
import { canUploadNormativaDoc, readUserRole } from "@/lib/auth/read-user-role";
import { PortalLeagueTheme } from "@/components/portal/PortalLeagueTheme";
import { loadLeaguePortalBranding } from "@/lib/leagues/league-branding";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ leagueSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { leagueSlug } = await params;
  const league = await fetchPortalLeagueBySlug(leagueSlug);
  if (!league) return { title: "Normativas" };
  return {
    title: `Normativas — ${league.name}`,
    description: `Documentación oficial pública de ${league.name}`,
  };
}

async function loadPageRole(): Promise<string | undefined> {
  try {
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
    return readUserRole(user);
  } catch {
    return undefined;
  }
}

export default async function LeaguePortalNormativasPage({ params }: PageProps) {
  const { leagueSlug } = await params;
  const leagueRow = await fetchPortalLeagueBySlug(leagueSlug);
  if (!leagueRow) notFound();

  const branding = await loadLeaguePortalBranding(leagueRow);
  const [role, normativasData] = await Promise.all([
    loadPageRole(),
    loadPublicNormativasForLeague(leagueRow.id),
  ]);

  const isNormativasAdmin = canUploadNormativaDoc(role);
  const panelHref = isNormativasAdmin ? await resolvePortalPanelHref() : undefined;
  const showUploadForm = isNormativasAdmin && normativasData.kind !== "migration";

  return (
    <PortalLeagueTheme branding={branding}>
      <div className="min-h-screen bg-[#f5f5f5]">
        <PortalSiteHeaderBar
          variant="normativas"
          panelHref={panelHref}
          hidePanelGestión={!isNormativasAdmin}
        />
        <div className="border-b border-slate-200 bg-white">
          <div className={`${PORTAL_SHELL_CLASS} pb-6 pt-1 sm:pt-2`}>
            <header>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                {branding.name}
              </p>
              <h1
                id="normativas-lectura-heading"
                className="mt-2 text-2xl font-black tracking-tight text-[#1e3a5f] sm:text-3xl"
              >
                Normativa institucional
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Documentación oficial publicada por esta liga. Solo se listan los documentos marcados
                como visibles en el portal público.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                <a href={leaguePortalHome(leagueSlug)} className="font-semibold text-[#005CEE] hover:underline">
                  ← Volver al portal de la liga
                </a>
              </p>
            </header>
          </div>
        </div>

        <main className={`${PORTAL_SHELL_CLASS} py-8 pb-16`}>
          {showUploadForm ? (
            <section className="mb-10" aria-label="Carga de normativas (solo administradores)">
              <NormativaUploadForm
                leagueId={leagueRow.id}
                publicListHint={`/l/${leagueSlug}/normativas/`}
              />
            </section>
          ) : null}

          <section aria-labelledby="normativas-lectura-heading">
            <NormativasPublicSection data={normativasData} />
          </section>
        </main>
      </div>
    </PortalLeagueTheme>
  );
}
