import { Suspense } from "react";
import { SponsorFooter } from "@/components/layout/SponsorFooter";
import { InstitutionalFooter } from "@/components/navigation/footer";

function SponsorsFooterSkeleton() {
  return (
    <footer
      className="mt-auto min-h-32 w-full shrink-0 border-t border-white/10 bg-black"
      aria-hidden
    />
  );
}

async function PortalSponsorFooter({ leagueId }: { leagueId: string }) {
  return <SponsorFooter leagueId={leagueId} />;
}

type LeaguePortalFootersProps = {
  leagueId: string;
};

/** Patrocinadores + T&C en el portal de la liga (p. ej. `/l/lddbi/`). */
export function LeaguePortalFooters({ leagueId }: LeaguePortalFootersProps) {
  return (
    <>
      <Suspense fallback={<SponsorsFooterSkeleton />}>
        <PortalSponsorFooter leagueId={leagueId} />
      </Suspense>
      <InstitutionalFooter />
    </>
  );
}
