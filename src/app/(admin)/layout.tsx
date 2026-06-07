import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logSecurityEvent } from "@/lib/observability/security-log";
import { Role } from "@/lib/auth/withAuth";
import { OperationalAppHeader } from "@/components/layout/OperationalAppHeader";
import { intranetPortalNavLabel } from "@/lib/auth/intranet-roles";

export const dynamic = "force-dynamic";

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

  if (!user) {
    redirect("/login");
  }

  const role = user.app_metadata?.role as Role;

  if (role !== "SUPER_ADMIN") {
    logSecurityEvent({
      type: "auth.route.forbidden",
      message: "Acceso denegado a zona super-admin",
      userId: user.id,
      role,
      route: "/super-admin",
    });
    redirect("/liga/");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#F5F5F5] font-sans">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-radial-[circle_at_top_right] from-blue-500/13 to-transparent to-35%"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-radial-[circle_at_bottom_left] from-blue-200/50 to-transparent to-45%"
        />
      </div>
      <OperationalAppHeader
        userEmail={user.email ?? null}
        intranetNavLabel={intranetPortalNavLabel(role)}
      />
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-3 py-4 pb-8 sm:px-4 sm:py-6 sm:pb-10 lg:px-8 animate-in fade-in duration-500">
        {children}
      </main>
      <footer className="relative z-10 border-t border-[#BFDBFE] bg-white/90 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-xs font-medium text-slate-400">
            &copy; {new Date().getFullYear()} Liga Deportiva Distrital de Basket de Iquitos - Panel de Administración
          </p>
        </div>
      </footer>
    </div>
  );
}
