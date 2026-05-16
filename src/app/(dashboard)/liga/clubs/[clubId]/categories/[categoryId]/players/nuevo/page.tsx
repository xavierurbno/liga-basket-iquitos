import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, clubs } from "@/lib/db/schema";
import { CrearJugadorCategoriaForm } from "@/components/system/CrearJugadorCategoriaForm";

export default async function NuevoJugadorCategoriaPage({
  params,
}: {
  params: Promise<{ clubId: string; categoryId: string }>;
}) {
  const { clubId, categoryId } = await params;
  const [club] = await db
    .select({ id: clubs.id, name: clubs.name })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);
  const [category] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.clubId, clubId)))
    .limit(1);
  if (!club) redirect("/liga/clubs");
  if (!category) redirect(`/liga/clubs/${clubId}`);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{club.name}</p>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo jugador - {category.name}</h1>
        </div>
        <Link
          href={`/liga/clubs/${clubId}/categories/${categoryId}`}
          className="rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-sm"
        >
          Volver a categoría
        </Link>
      </div>
      <CrearJugadorCategoriaForm clubId={clubId} categoryId={categoryId} />
    </div>
  );
}
