import { DocumentosModule } from "@/components/documentos/DocumentosModule";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDashboardSuperAdmin } from "@/lib/auth/dashboard-super-admin";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";

export const metadata = {
  title: "Gestión Documental | Liga Basket Iquitos",
  description:
    "Genera Cartas de Pase y Constancias de Jugador de forma oficial para la Liga Deportiva Distrital Mixta de Basket de Iquitos.",
};

export default async function DocumentosPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll() {},
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isSuperAdmin = isDashboardSuperAdmin(user);

  if (!isSuperAdmin) {
    redirect("/liga/");
  }

  const filterLeagueId = resolveOperationalLeagueId(user, cookieStore);

  return <DocumentosModule filterLeagueId={filterLeagueId} />;
}
