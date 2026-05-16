import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RegistroJugadorForm } from "@/components/forms/RegistroJugadorForm";

interface NuevoJugadorPageProps {
  params: Promise<{ clubSlug: string }>;
}

export default async function NuevoJugadorPage({ params }: NuevoJugadorPageProps) {
  const { clubSlug } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .single();

  if (!club) redirect("/");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div
          className="w-12 h-12 rounded-xl text-white flex items-center justify-center text-xl font-bold shadow-sm"
          style={{ backgroundColor: "var(--club-primary, #1e3a5f)" }}
        >
          {club.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Nueva Inscripción
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Registra un nuevo jugador en la base de datos de {club.name}.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
        <RegistroJugadorForm clubId={club.id} clubSlug={clubSlug} />
      </div>
    </div>
  );
}
