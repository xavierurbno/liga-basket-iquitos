import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { RegistroJugadorForm } from "@/components/forms/RegistroJugadorForm";
import { redirect } from "next/navigation";

interface NuevoJugadorPageProps {
  params: { clubSlug: string };
}

export default async function NuevoJugadorPage({ params }: NuevoJugadorPageProps) {
  // Query para obtener el club y pasar el clubId al formulario.
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  let { data: club } = await supabase
    .from("clubs")
    .select("id, nombre")
    .eq("slug", params.clubSlug)
    .single();

  if (!club) {
    // Si la BD falla o no hay sesión real, proveemos un mock para ver la UI
    club = { id: "mock-uuid-1234", nombre: "Liga Ficticia (Modo Prueba)" };
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="w-12 h-12 rounded-xl text-white flex items-center justify-center text-xl font-bold shadow-sm" style={{ backgroundColor: "var(--club-primary, #1e3a5f)" }}>
          {club.nombre.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Nueva Inscripción
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Registra un nuevo jugador en la base de datos de {club.nombre}.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
        <RegistroJugadorForm clubId={club.id} clubSlug={params.clubSlug} />
      </div>
    </div>
  );
}
