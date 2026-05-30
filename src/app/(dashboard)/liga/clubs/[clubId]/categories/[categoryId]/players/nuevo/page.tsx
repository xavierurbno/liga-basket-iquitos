import Link from "next/link";
import { redirect } from "next/navigation";
import { loadNewPlayerPage } from "@/lib/loaders/category-page.loader";
import { CrearJugadorCategoriaForm } from "@/components/system/CrearJugadorCategoriaForm";

export default async function NuevoJugadorCategoriaPage({
  params,
}: {
  params: Promise<{ clubId: string; categoryId: string }>;
}) {
  const { clubId, categoryId } = await params;
  const loaded = await loadNewPlayerPage(clubId, categoryId);
  if (!loaded) redirect("/liga/clubs");
  const { club, category } = loaded;
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
