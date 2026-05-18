import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, clubs, players } from "@/lib/db/schema";
import { FichaVistaPrevia } from "@/components/ficha/FichaVistaPrevia";
import { GenerateFichaPDF } from "@/components/ficha/GenerateFichaPDF";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";

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

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <GenerateFichaPDF
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
