import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { createServerClient } from "@supabase/ssr";
import { db } from "@/lib/db/client";
import { categories, clubs, players } from "@/lib/db/schema";
import { FichaVistaPrevia } from "@/components/ficha/FichaVistaPrevia";
import { GenerateFichaPDF } from "@/components/ficha/GenerateFichaPDF";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";
import { leagueRepository } from "@/repositories/league.repository";
import { loadLeaguePortalBranding } from "@/lib/leagues/league-branding";
import { resolveLeagueDisplayLogoUrl } from "@/lib/logos/resolve-public-league-logo.server";
import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";
import { FICHA_T2 } from "@/lib/pdf/fichaInstitucionalTextos";

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
  const [club] = await db
    .select({
      id: clubs.id,
      leagueId: clubs.leagueId,
      name: clubs.name,
      logoUrl: clubs.logoUrl,
      foundationDate: clubs.foundationDate,
      slug: clubs.slug,
    })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);
  if (!club) redirect("/liga/clubs");

  const [category] = await db
    .select({
      name: categories.name,
      coachName: categories.coachName,
      coachLastname: categories.coachLastname,
      coachDocumentType: categories.coachDocumentType,
      coachDocumentNumber: categories.coachDocumentNumber,
      coachPhotoUrl: categories.coachPhotoUrl,
      delegateName: categories.delegateName,
      delegateLastname: categories.delegateLastname,
      delegateDocumentType: categories.delegateDocumentType,
      delegateDocumentNumber: categories.delegateDocumentNumber,
      delegatePhotoUrl: categories.delegatePhotoUrl,
    })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.clubId, clubId)))
    .limit(1);
  if (!category) redirect(`/liga/clubs/${clubId}`);

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const operationalLeagueId = user ? resolveOperationalLeagueId(user, cookieStore) : null;
  const effectiveLeagueId = club.leagueId?.trim() || operationalLeagueId;

  let leagueDisplayName = FICHA_T2;
  let leagueLogoUrl = "";
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
  } else {
    leagueLogoUrl = "/logos/liga.png";
  }

  const listaJugadores = await db
    .select({
      id: players.id,
      name: players.name,
      lastname: players.lastname,
      documentType: players.documentType,
      documentNumber: players.documentNumber,
      birthdate: players.birthdate,
      photoUrl: players.photoUrl,
      jerseyNumber: players.jerseyNumber,
      gender: players.gender,
    })
    .from(players)
    .where(and(eq(players.clubId, clubId), eq(players.categoryId, categoryId)));

  const categoriaDetalle = lineaCategoriaInstitucional(
    category.name,
    listaJugadores.map((j) => j.gender)
  );

  const fileName = `ficha-${club.slug}-${category.name}`
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  const jugadoresPreview = listaJugadores.map((j) => ({
    id: j.id,
    name: j.name,
    lastname: j.lastname,
    documentType: j.documentType,
    documentNumber: j.documentNumber,
    fechaNacimientoIso: aIso(j.birthdate) ?? "",
    photoUrl: j.photoUrl,
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
          leagueDisplayName={leagueDisplayName}
          fileName={fileName}
          teamId={categoryId}
          clubName={club.name}
          clubLogoUrl={club.logoUrl}
          categoriaDetalle={categoriaDetalle}
          coachName={category.coachName}
          coachLastname={category.coachLastname}
          coachDocumentType={category.coachDocumentType}
          coachDocumentNumber={category.coachDocumentNumber}
          coachPhotoUrl={category.coachPhotoUrl}
          delegateName={category.delegateName}
          delegateLastname={category.delegateLastname}
          delegateDocumentType={category.delegateDocumentType}
          delegateDocumentNumber={category.delegateDocumentNumber}
          delegatePhotoUrl={category.delegatePhotoUrl}
          players={jugadoresPreview.map(({ id, ...rest }) => rest)}
        />
      </div>

      <FichaVistaPrevia
        leagueDisplayName={leagueDisplayName}
        leagueLogoUrl={leagueLogoUrl}
        clubName={club.name}
        clubLogoUrl={club.logoUrl}
        categoriaDetalle={categoriaDetalle}
        players={jugadoresPreview}
        entrenador={{
          name: category.coachName,
          lastname: category.coachLastname,
          documentType: category.coachDocumentType,
          documentNumber: category.coachDocumentNumber,
          photoUrl: category.coachPhotoUrl,
        }}
        delegado={{
          name: category.delegateName,
          lastname: category.delegateLastname,
          documentType: category.delegateDocumentType,
          documentNumber: category.delegateDocumentNumber,
          photoUrl: category.delegatePhotoUrl,
        }}
      />
    </div>
  );
}
