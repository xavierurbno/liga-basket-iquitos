import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { db } from "@/lib/db/client";
import { categories, clubs } from "@/lib/db/schema";
import { CrearCategoriaModal } from "@/components/system/CrearCategoriaModal";
import { EditarCategoriaButton } from "@/components/system/EditarCategoriaButton";
import { eliminarCategoriaFormAction } from "@/lib/actions/system-dashboard";
import { clubBelongsToOperationalLeague } from "@/lib/auth/operational-league-scope";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";
import { Images } from "lucide-react";

export default async function ClubCategoriasPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;

  const [club] = await db
    .select({ id: clubs.id, name: clubs.name, leagueId: clubs.leagueId })
    .from(clubs)
    .where(eq(clubs.id, clubId))
    .limit(1);
  if (!club) redirect("/liga/clubs");

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined;
  const operationalLeagueId = user ? resolveOperationalLeagueId(user, cookieStore) : null;

  if (
    !clubBelongsToOperationalLeague(club.leagueId, operationalLeagueId, role)
  ) {
    notFound();
  }

  const categorias = await db.query.categories.findMany({
    where: (categories, { eq }) => eq(categories.clubId, clubId),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Club / Categorías</p>
          <h1 className="text-2xl font-bold text-slate-900">{club.name}</h1>
        </div>
        <Link href="/liga/clubs" className="rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-sm">
          Volver a clubes
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/liga/clubs/${clubId}/galeria`}
            className="flex items-center gap-2 rounded-xl border border-[#005CEE] bg-[#005CEE] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#004FCC] hover:shadow-md active:scale-95"
          >
            <Images className="h-4 w-4" />
            Galería del club
          </Link>
          <CrearCategoriaModal clubId={clubId} />
        </div>

        {categorias.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Sin categorías. Crea la primera con el botón superior.
          </p>
        ) : (
          <div className="space-y-2">
            {categorias.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{cat.name}</p>
                  {cat.description ? (
                    <p className="text-xs text-slate-500">{cat.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/liga/clubs/${clubId}/categories/${cat.id}/`}
                    className="rounded-lg bg-[#005CEE] px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    Ver categoría
                  </Link>
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
                  <form action={eliminarCategoriaFormAction}>
                    <input type="hidden" name="clubId" value={clubId} />
                    <input type="hidden" name="categoryId" value={cat.id} />
                    <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
