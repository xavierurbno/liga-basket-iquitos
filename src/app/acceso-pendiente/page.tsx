import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SiteTopNav } from "@/components/layout/SiteTopNav";
import { hasIntranetAccess } from "@/lib/auth/intranet-roles";

export const dynamic = "force-dynamic";

export default async function AccesoPendientePage() {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.app_metadata?.role as string | undefined;
  if (hasIntranetAccess(role)) {
    redirect("/liga/");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteTopNav />
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Acceso no disponible</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Tu cuenta está activa, pero no tienes un rol de gestión asignado (delegado de club o administrador). Si
          necesitas acceso al panel, contacta a la administración de la liga.
        </p>
        <p className="mt-2 text-xs text-slate-500">Sesión: {user.email}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex justify-center rounded-xl bg-[#005CEE] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#004bb5]"
          >
            Volver al portal
          </Link>
          <Link
            href="/normativas/"
            className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-[#005CEE]"
          >
            Ver normativas
          </Link>
        </div>
      </main>
    </div>
  );
}
