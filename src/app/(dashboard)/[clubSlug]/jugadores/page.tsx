import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function JugadoresPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {},
      },
    }
  );
  const { data: club } = await supabase.from("clubs").select("id, name").eq("slug", clubSlug).single();
  if (!club) redirect("/");

  const categorias = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.clubId, club.id))
    .orderBy(asc(categories.name));

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Jugadores</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inscripción individual, carga masiva y listados por categoría (entrenador, delegado y deportistas).
          </p>
        </div>
        <Link
          href="./nuevo"
          className="rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
          style={{ backgroundColor: "var(--club-primary, #1e3a5f)" }}
        >
          + Inscribir Jugador
        </Link>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Por categoría</h2>
        {categorias.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            Aún no hay categorías. Créalas desde{" "}
            <Link href={`/liga/clubs/${club.id}`} className="font-semibold text-[#005CEE] hover:underline">
              Clubes → {club.name}
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {categorias.map((cat) => (
              <li
                key={cat.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{cat.name}</p>
                  <p className="text-xs text-slate-500">Registro masivo, edición y lista completa</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/liga/clubs/${club.id}/categories/${cat.id}`}
                    className="rounded-lg border border-[#BFDBFE] bg-white px-3 py-1.5 text-xs font-bold text-[#005CEE] hover:border-[#005CEE]"
                  >
                    Abrir categoría
                  </Link>
                  <Link
                    href={`/liga/clubs/${club.id}/categories/${cat.id}/players/nuevo`}
                    className="rounded-lg bg-[#005CEE] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#004FCC]"
                  >
                    + Inscribir aquí
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
