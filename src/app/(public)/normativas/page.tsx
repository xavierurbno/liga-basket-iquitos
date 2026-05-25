import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { PortalSiteHeaderBar, resolvePortalPanelHref } from "@/components/layout/PortalSiteHeader";
import { NormativaUploadForm } from "@/components/normativas/NormativaUploadForm";
import { NormativasPublicSection } from "@/components/normativas/NormativasPublicSection";
import { loadPublicNormativasForLeague } from "@/lib/normativas/load-public-normativas";
import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";
import { canUploadNormativaDoc, readUserRole } from "@/lib/auth/read-user-role";
import { leagueRepository } from "@/repositories/league.repository";

export const dynamic = "force-dynamic";

async function loadNormativasPageRole(): Promise<string | undefined> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url?.trim() || !anon?.trim()) return undefined;
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {},
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return readUserRole(user);
  } catch {
    return undefined;
  }
}

export default async function NormativasPublicPage() {
  const defaultLeague = await leagueRepository.findDefaultForPortal();
  const leagueId = defaultLeague?.id ?? null;

  const [role, normativasData] = await Promise.all([
    loadNormativasPageRole(),
    leagueId
      ? loadPublicNormativasForLeague(leagueId)
      : Promise.resolve({
          kind: "list" as const,
          docs: [],
        }),
  ]);

  const isNormativasAdmin = canUploadNormativaDoc(role);
  const panelHref = isNormativasAdmin ? await resolvePortalPanelHref() : undefined;
  const showUploadForm = isNormativasAdmin && normativasData.kind !== "migration" && Boolean(leagueId);

  return (
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
              Transparencia
            </p>
            <h1
              id="normativas-lectura-heading"
              className="mt-2 text-2xl font-black tracking-tight text-[#1e3a5f] sm:text-3xl"
            >
              Normativa institucional
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Documentación oficial de la liga principal (Iquitos / LDDBI). Para otras ligas del
              programa, usa el enlace de normativas en cada portal{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">/l/[slug]/normativas/</code>.
            </p>
          </header>
        </div>
      </div>

      <main className={`${PORTAL_SHELL_CLASS} py-8 pb-16`}>
        {showUploadForm && leagueId ? (
          <section className="mb-10" aria-label="Carga de normativas (solo administradores)">
            <NormativaUploadForm leagueId={leagueId} publicListHint="/normativas/" />
          </section>
        ) : null}

        <section aria-labelledby="normativas-lectura-heading">
          <NormativasPublicSection data={normativasData} />
        </section>
      </main>
    </div>
  );
}
