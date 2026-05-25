import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteTopNav } from "@/components/layout/SiteTopNav";
import { PORTAL_SHELL_CLASS } from "@/lib/portal-layout";

interface PublicGalleryShellProps {
  title: string;
  subtitle?: string;
  photoCount: number;
  children: React.ReactNode;
  leagueSlug?: string;
  leagueName?: string;
  leagueLogoUrl?: string | null;
  backHref?: string;
}

export function PublicGalleryShell({
  title,
  subtitle,
  photoCount,
  children,
  leagueSlug,
  leagueName,
  leagueLogoUrl,
  backHref = "/",
}: PublicGalleryShellProps) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#F5F5F5]">
      <SiteTopNav
        leagueSlug={leagueSlug}
        leagueName={leagueName}
        leagueLogoUrl={leagueLogoUrl}
      />
      <main className={`flex-1 pb-10 pt-4 ${PORTAL_SHELL_CLASS}`}>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={backHref}
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#005CEE]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-[#1e3a5f] sm:text-3xl">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          <span className="w-fit rounded-full bg-[#005CEE]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#005CEE]">
            {photoCount} foto{photoCount !== 1 ? "s" : ""}
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
