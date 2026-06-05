import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { loadFichaCategoryPage } from "@/lib/loaders/category-page.loader";
import { FichaVistaPrevia } from "@/components/ficha/FichaVistaPrevia";
import { GenerateFichaPDF } from "@/components/ficha/GenerateFichaPDF";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";
import { getLigaOperationalContext } from "@/lib/auth/liga-operational-context";
import { withQueryTimeout } from "@/lib/db/query-timeout";
import { leagueRepository } from "@/repositories/league.repository";
import { loadLeaguePortalBranding } from "@/lib/leagues/league-branding";
import { resolveLeagueDisplayLogoUrl } from "@/lib/logos/resolve-public-league-logo.server";
import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";
import { FICHA_T2 } from "@/lib/pdf/fichaInstitucionalTextos";
import { resolvePublicImageUrl } from "@/lib/validar/resolve-public-image-url";

function aIso(transactionDate: Date | null | undefined): string | null {
  if (!transactionDate) return null;
  const t = new Date(transactionDate);
  if (Number.isNaN(t.getTime())) return null;
  return t.toISOString();
}

export default async function FichaCategoriaPage({
  params,
}: {
  params: Promise<{ clubId: string; categoryId: string }>;
}) {
  const { clubId, categoryId } = await params;

  const loaded = await loadFichaCategoryPage(clubId, categoryId);
  if (!loaded) redirect("/liga/clubs");
  const { club, category, listaJugadores } = loaded;

  if (!club) redirect("/liga/clubs");
  if (!category) redirect(`/liga/clubs/${clubId}`);

  const opContext =
    club.leagueId?.trim()
      ? null
      : await withQueryTimeout(getLigaOperationalContext(), 12_000, "ligaOperationalContext").catch(
          () => null,
        );

  const effectiveLeagueId = club.leagueId?.trim() || opContext?.leagueId || null;

  let leagueDisplayName = FICHA_T2;
  let leagueLogoUrl = "/logos/liga.png";

  if (effectiveLeagueId) {
    const leagueRow = await leagueRepository.findById(effectiveLeagueId);
    if (leagueRow) {
      const branding = await loadLeaguePortalBranding(leagueRow);
      leagueDisplayName = branding.name;
      const resolvedLogo = await resolveLeagueDisplayLogoUrl({
        slug: leagueRow.slug,
        loginLogoUrl: branding.logoUrl,
      });
      leagueLogoUrl =
        resolvedLogo ??
        (isPrimaryPortalLeagueSlug(leagueRow.slug) ? "/logos/liga.png" : "");
    }
  }

  const categoriaDetalle = lineaCategoriaInstitucional(
    category.name,
    listaJugadores.map((j) => j.gender),
  );

  const fileName = `ficha-${club.slug}-${category.name}`
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  const clubLogoPublic = resolvePublicImageUrl(club.logoUrl);

  const jugadoresPreview = listaJugadores.map((j) => ({
    id: j.id,
    name: j.name,
    lastname: j.lastname,
    documentType: j.documentType,
    documentNumber: j.documentNumber,
    fechaNacimientoIso: aIso(j.birthdate) ?? "",
    photoUrl: resolvePublicImageUrl(j.photoUrl),
    jerseyNumber: j.jerseyNumber,
  }));

  const categoriaHref = `/liga/clubs/${clubId}/categories/${categoryId}/`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={categoriaHref}
          className="inline-flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#005CEE] hover:text-[#005CEE]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a la categoría
        </Link>
        <GenerateFichaPDF
          leagueId={effectiveLeagueId}
          leagueLogoUrl={leagueLogoUrl || null}
          leagueDisplayName={leagueDisplayName}
          fileName={fileName}
          teamId={categoryId}
          clubName={club.name}
          clubLogoUrl={clubLogoPublic}
          categoriaDetalle={categoriaDetalle}
          coachName={category.coachName}
          coachLastname={category.coachLastname}
          coachDocumentType={category.coachDocumentType}
          coachDocumentNumber={category.coachDocumentNumber}
          coachPhotoUrl={resolvePublicImageUrl(category.coachPhotoUrl)}
          delegateName={category.delegateName}
          delegateLastname={category.delegateLastname}
          delegateDocumentType={category.delegateDocumentType}
          delegateDocumentNumber={category.delegateDocumentNumber}
          delegatePhotoUrl={resolvePublicImageUrl(category.delegatePhotoUrl)}
          players={jugadoresPreview}
        />
      </div>

      <FichaVistaPrevia
        leagueDisplayName={leagueDisplayName}
        leagueLogoUrl={leagueLogoUrl}
        clubName={club.name}
        clubLogoUrl={clubLogoPublic}
        categoriaDetalle={categoriaDetalle}
        players={jugadoresPreview}
        entrenador={{
          name: category.coachName,
          lastname: category.coachLastname,
          documentType: category.coachDocumentType,
          documentNumber: category.coachDocumentNumber,
          photoUrl: resolvePublicImageUrl(category.coachPhotoUrl),
        }}
        delegado={{
          name: category.delegateName,
          lastname: category.delegateLastname,
          documentType: category.delegateDocumentType,
          documentNumber: category.delegateDocumentNumber,
          photoUrl: resolvePublicImageUrl(category.delegatePhotoUrl),
        }}
      />
    </div>
  );
}
