import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories, clubs } from "@/lib/db/schema";
import { CrearCategoriaModal } from "@/components/system/CrearCategoriaModal";
import { EditarCategoriaButton } from "@/components/system/EditarCategoriaButton";
import { eliminarCategoriaAction } from "@/lib/actions/system-dashboard";
import { Images } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClubCategoriasPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;

  const [club] = await db
    .select({ id: clubs.id, name: clubs.name })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);
  if (!club) redirect("/liga/clubs");

  const categorias = await db.query.categories.findMany({
    where: (categories, { eq }) => eq(categories.clubId, clubId)
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Nuevo Club / Categorías</p>
          <h1 className="text-2xl font-bold text-slate-900">{club.name}</h1>
        </div>
        <Link href="/liga/clubs" className="rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-sm">
          Volver a CLUBES
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {/* Galería del Club */}
          <Link
            href={`/liga/clubs/${clubId}/galeria`}
            className="flex items-center gap-2 rounded-xl border border-[#005CEE] bg-[#005CEE] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#004FCC] hover:shadow-md active:scale-95"
          >
            <Images className="h-4 w-4" />
            Galería del Club
          </Link>
          <CrearCategoriaModal clubId={clubId} />
        </div>
        <section className="rounded-2xl border border-[#BFDBFE] bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Categorías creadas</h2>
          {categorias.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aún no hay categorías para este club.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {categorias.map((cat) => (
                <li
                  key={cat.id}
                  className="relative rounded-xl border border-slate-200 p-3 transition hover:border-[#93C5FD] hover:bg-[#F8FAFC]"
                >
                  <Link
                    href={`/liga/clubs/${clubId}/categories/${cat.id}`}
                    className="absolute inset-0 rounded-xl"
                    aria-label={`Abrir categoría ${cat.name}`}
                  />
                  <div className="relative z-10 flex items-start justify-between gap-2">
                    <div className="pointer-events-none">
                      <p className="font-medium text-slate-900">{cat.name}</p>
                      {cat.description && <p className="text-sm text-slate-600">{cat.description}</p>}
                    </div>
                    <div className="relative z-20 flex items-center gap-2">
                      <EditarCategoriaButton
                        clubId={clubId}
                        categoryId={cat.id}
                        name={cat.name}
                        description={cat.description}
                        coachName={cat.coachName}
                        coachLastname={cat.coachLastname}
                        coachDocumentType={cat.coachDocumentType}
                        coachDocumentNumber={cat.coachDocumentNumber}
                        coachBirthdate={cat.coachBirthdate}
                        coachContact={cat.coachContact}
                        coachEmail={cat.coachEmail}
                        coachPhotoUrl={cat.coachPhotoUrl}
                        delegateName={cat.delegateName}
                        delegateLastname={cat.delegateLastname}
                        delegateDocumentType={cat.delegateDocumentType}
                        delegateDocumentNumber={cat.delegateDocumentNumber}
                        delegateBirthdate={cat.delegateBirthdate}
                        delegateContact={cat.delegateContact}
                        delegateEmail={cat.delegateEmail}
                        delegatePhotoUrl={cat.delegatePhotoUrl}
                      />
                      <form action={eliminarCategoriaAction as any}>
                        <input type="hidden" name="clubId" value={clubId} />
                        <input type="hidden" name="categoryId" value={cat.id} />
                        <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="pointer-events-none relative z-10 mt-2 text-xs text-slate-500">
                    Entrenador: {cat.coachName || "No asignado"} · Delegado:{" "}
                    {cat.delegateName || "No asignado"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
