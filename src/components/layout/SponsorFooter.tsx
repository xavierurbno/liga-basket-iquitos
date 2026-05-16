import { getSponsorsByLeagueAction } from "@/lib/actions/sponsors";
import { getCachedLeagueSettings } from "@/lib/data/cached-queries";
import { Sponsor } from "@/lib/db/schema";

export async function SponsorFooter({ leagueId: propLeagueId }: { leagueId?: string }) {
  try {
    const settings = await getCachedLeagueSettings();
    let leagueId = propLeagueId || settings?.leagueId;

    if (!leagueId) return null;

    const sponsors = await getSponsorsByLeagueAction(leagueId);

    if (!sponsors || sponsors.length === 0) {
      return (
        <footer className="mt-auto w-full shrink-0 border-t border-white/10 bg-black px-4 py-20 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] sm:px-8">
          <div className="mx-auto w-full max-w-none space-y-4 text-center">
            <div className="w-12 h-px bg-white/10 mx-auto" />
            <p className="text-white/30 text-[11px] font-black uppercase tracking-[0.5em] leading-loose">
              Espacio disponible para <br className="sm:hidden" /> patrocinadores institucionales
            </p>
            <div className="w-12 h-px bg-white/10 mx-auto" />
          </div>
        </footer>
      );
    }

    const grouped = sponsors.reduce((acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    }, {} as Record<string, Sponsor[]>);

    const categoryOrder = [
      "SOCIOS_PATROCINADORES",
      "PATR_TECNICO",
      "PATROCINADORES_OFICIALES",
      "PROVEEDORES",
      "INSTITUCIONALES",
    ];

    const categoryLabels: Record<string, string> = {
      SOCIOS_PATROCINADORES: "SOCIOS PATROCINADORES",
      PATR_TECNICO: "PATROCINADOR TÉCNICO",
      PATROCINADORES_OFICIALES: "PATROCINADORES OFICIALES",
      PROVEEDORES: "PROVEEDORES",
      INSTITUCIONALES: "INSTITUCIONALES",
    };

    return (
      <footer className="mt-auto w-full shrink-0 border-t border-white/10 bg-black px-4 py-12 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] sm:px-8">
        <div className="mx-auto w-full max-w-none space-y-12">
          {categoryOrder.map((catKey) => {
            const items = grouped[catKey];
            if (!items || items.length === 0) return null;

            return (
              <div key={catKey} className="space-y-6">
                {/* Título de Categoría con líneas decorativas */}
                <div className="flex items-center gap-6">
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/20 to-transparent" />
                  <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em] whitespace-nowrap">
                    {categoryLabels[catKey]}
                  </h2>
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/20 to-transparent" />
                </div>

                {/* Grid de Logos a Color */}
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
                  {items.map((sponsor) => (
                    <a
                      key={sponsor.id}
                      href={sponsor.websiteUrl || "#"}
                      target={sponsor.websiteUrl ? "_blank" : undefined}
                      rel={sponsor.websiteUrl ? "noopener noreferrer" : undefined}
                      className="group relative transition-all duration-300"
                    >
                      <div className="rounded-4xl border border-white/5 bg-white/3 p-6 transition-all duration-500 backdrop-blur-sm hover:border-white/10 hover:bg-white/7 group-hover:-translate-y-2">
                        <img
                          src={sponsor.logoUrl}
                          alt={sponsor.name}
                          className="h-16 md:h-24 w-auto object-contain mx-auto transition-all duration-700 group-hover:scale-110 filter drop-shadow-2xl"
                        />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Footer Legal */}
          <div className="pt-16 border-t border-white/5 text-center">
            <p className="text-[10px] font-bold text-white uppercase tracking-widest">
              © {new Date().getFullYear()} Liga Deportiva Distrital Mixta de Basket de Iquitos
            </p>
          </div>
        </div>
      </footer>
    );
  } catch (error) {
    console.error("[SponsorFooter] Error:", error);
    return null;
  }
}
