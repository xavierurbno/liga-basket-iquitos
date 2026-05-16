import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@/lib/auth/withAuth";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

/**
 * AdminLayout
 * Protege las rutas administrativas asegurando que solo el SUPER_ADMIN pueda acceder.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Redirigir si no hay sesión activa
  if (!user) {
    redirect("/login");
  }

  // 2. Validar el rol de SUPER_ADMIN en app_metadata
  const role = user.app_metadata?.role as Role;

  if (role !== "SUPER_ADMIN") {
    console.warn(`[SECURITY] Intento de acceso no autorizado a (admin) por usuario ${user.id} con rol ${role}`);
    redirect("/liga/");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AdminNavbar userEmail={user.email ?? undefined} />

      {/* Contenido Principal */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        {children}
      </main>

      {/* Footer Minimalista */}
      <footer className="py-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} Liga Deportiva Distrital de Basket de Iquitos - Panel de Administración
          </p>
        </div>
      </footer>
    </div>
  );
}
