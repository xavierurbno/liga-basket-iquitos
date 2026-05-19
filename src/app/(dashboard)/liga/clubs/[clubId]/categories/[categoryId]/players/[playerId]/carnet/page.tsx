import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, clubs, players } from "@/lib/db/schema";
import { GenerateCarnetPDF } from "@/components/carnet/GenerateCarnetPDF";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";

function aIso(transactionDate: Date | null | undefined): string {
  if (!transactionDate) return "";
  const t = new Date(transactionDate);
  if (Number.isNaN(t.getTime())) return "";
  return t.toISOString();
}

function resolvePublicImageUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  if (rawUrl.includes("/storage/v1/object/sign/")) {
    const [withoutQuery] = rawUrl.split("?");
    return withoutQuery.replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
  }
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const key = rawUrl.replace(/^\/+/, "");
  const hasBucket = key.startsWith("jugador-fotos/") || key.startsWith("club-assets/");
  if (hasBucket) return `${supabaseUrl}/storage/v1/object/public/${key}`;
  return `${supabaseUrl}/storage/v1/object/public/jugador-fotos/${key}`;
}

export default async function CarnetJugadorPage({
  params,
}: {
  params: Promise<{ clubId: string; categoryId: string; playerId: string }>;
}) {
  const { clubId, categoryId, playerId } = await params;

  const [club] = await db
    .select({
      id: clubs.id,
      name: clubs.name,
      logoUrl: clubs.logoUrl,
      slug: clubs.slug,
    })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);
  if (!club) redirect("/liga/clubs");

  const [category] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.clubId, clubId)))
    .limit(1);
  if (!category) redirect(`/liga/clubs/${clubId}`);

  const [jugador] = await db
    .select({
      id: players.id,
      name: players.name,
      lastname: players.lastname,
      documentType: players.documentType,
      documentNumber: players.documentNumber,
      birthdate: players.birthdate,
      photoUrl: players.photoUrl,
      carnetNumber: players.carnetNumber,
      gender: players.gender,
    })
    .from(players)
    .where(
      and(
        eq(players.id, playerId),
        eq(players.clubId, clubId),
        eq(players.categoryId, categoryId),
      ),
    )
    .limit(1);
  if (!jugador) redirect(`/liga/clubs/${clubId}/categories/${categoryId}`);

  const categoriaDetalle = lineaCategoriaInstitucional(category.name, [jugador.gender]);
  const fotoPublica = resolvePublicImageUrl(jugador.photoUrl);
  const fileName = `carnet-${club.slug}-${jugador.documentNumber}`.replace(/[^a-zA-Z0-9._-]/g, "-");

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{club.name}</p>
          <h1 className="text-xl font-bold text-slate-900">
            Carnet — {jugador.lastname}, {jugador.name}
          </h1>
          <p className="text-sm text-slate-600">{categoriaDetalle}</p>
        </div>
        <Link
          href={`/liga/clubs/${clubId}/categories/${categoryId}`}
          className="rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-sm"
        >
          Volver
        </Link>
      </div>
      <div className="rounded-2xl border border-[#BFDBFE] bg-white p-6 shadow-sm">
        <div className="flex gap-4">
          <div className="relative h-28 w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {fotoPublica ? (
              <Image src={fotoPublica} alt="" fill className="object-cover" sizes="72px" />
            ) : (
              <p className="flex h-full items-center justify-center text-xs text-slate-400">Sin foto</p>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1 text-sm">
            <p className="font-bold text-slate-900">
              {jugador.documentType}: {jugador.documentNumber}
            </p>
            <p className="text-slate-600">
              Nac.{" "}
              {jugador.birthdate
                ? new Date(jugador.birthdate).toLocaleDateString("es-PE")
                : "—"}
            </p>
            {jugador.carnetNumber ? (
              <p className="font-mono text-xs font-semibold text-[#2563EB]">
                N° {jugador.carnetNumber}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 print:hidden">
          <GenerateCarnetPDF
            playerId={jugador.id}
            fileName={fileName}
            name={jugador.name}
            lastname={jugador.lastname}
            documentType={jugador.documentType}
            documentNumber={jugador.documentNumber}
            fechaNacimientoIso={aIso(jugador.birthdate)}
            clubName={club.name}
            categoriaDetalle={categoriaDetalle}
            carnetNumber={jugador.carnetNumber}
            photoUrl={fotoPublica}
            clubLogoUrl={club.logoUrl}
            label="Descargar carnet PDF"
            className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#1D4ED8] disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  );
}
