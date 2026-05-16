import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Settings2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClubConfiguracionPage({ params }: { params: Promise<{ clubSlug: string }> }) {
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
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, color_primary, color_secondary")
    .eq("slug", clubSlug)
    .single();
  if (!club) redirect("/");

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Settings2 className="h-9 w-9 shrink-0 text-slate-600" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Configuración</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Identidad visual y enlaces operativos del club <strong>{club.name}</strong>.
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Color primario</p>
          <p className="mt-1 font-mono text-sm">{club.color_primary || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Color secundario</p>
          <p className="mt-1 font-mono text-sm">{club.color_secondary || "—"}</p>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        <li>
          <Link
            href={`/liga/clubs/${club.id}`}
            className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#005CEE] hover:border-[#005CEE] dark:border-slate-700 dark:bg-slate-900"
          >
            Categorías, staff y deportistas
          </Link>
        </li>
        <li>
          <Link
            href="/liga/"
            className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#005CEE] hover:border-[#005CEE] dark:border-slate-700 dark:bg-slate-900"
          >
            Panel operativo de la liga
          </Link>
        </li>
      </ul>
    </div>
  );
}
