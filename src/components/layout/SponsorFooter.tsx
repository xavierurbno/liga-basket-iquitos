import { SponsorLogoImage } from "@/components/sponsors/SponsorLogoImage";
import { SPONSOR_FEB_CATEGORY_LABEL_CLASS } from "@/components/sponsors/sponsorFebDisplay";
import { getSponsorsByLeagueAction } from "@/lib/actions/sponsors";
import { withQueryTimeout } from "@/lib/db/query-timeout";
import { Sponsor } from "@/lib/db/schema";
import {
  readPortalLeagueIdFromEnv,
  resolveDefaultPortalLeagueId,
} from "@/lib/portal/portal-league-cache";

const FOOTER_MS = process.env.NODE_ENV === "development" ? 15_000 : 8_000;

export async function SponsorFooter({ leagueId: propLeagueId }: { leagueId?: string }) {
  try {
    let leagueId = propLeagueId ?? readPortalLeagueIdFromEnv();

    if (!leagueId) {
      leagueId = await withQueryTimeout(
        resolveDefaultPortalLeagueId(),
        FOOTER_MS,
        "footerLeagueDefault",
      );
    }

    if (!leagueId) return null;

    const sponsors = await withQueryTimeout(
      getSponsorsByLeagueAction(leagueId),
      FOOTER_MS,
      "footerSponsors"
    );

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
              <div key={catKey} className="space-y-5 md:space-y-6">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/25 to-transparent" />
                  <h2 className={SPONSOR_FEB_CATEGORY_LABEL_CLASS}>{categoryLabels[catKey]}</h2>
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/25 to-transparent" />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-14 md:gap-y-10">
                  {items.map((sponsor) => (
                    <a
                      key={sponsor.id}
                      href={sponsor.websiteUrl || "#"}
                      target={sponsor.websiteUrl ? "_blank" : undefined}
                      rel={sponsor.websiteUrl ? "noopener noreferrer" : undefined}
                      className="group flex min-w-[5rem] items-center justify-center px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                      title={sponsor.name}
                    >
                      <SponsorLogoImage
                        name={sponsor.name}
                        logoUrl={sponsor.logoUrl}
                        category={catKey}
                        variant="footer"
                      />
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
