import Link from "next/link";
import { clubs } from "@/lib/db/schema";
import { getCachedClubs } from "@/lib/data/cached-queries";
import { eliminarClubFormAction } from "@/lib/actions/system-dashboard";
import { EditarClubModal } from "@/components/system/EditarClubModal";
import { CrearClubModal } from "@/components/system/CrearClubModal";
import { type IntranetRole, INTRANET_ROLES } from "@/lib/auth/intranet-roles";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clubRepository } from "@/repositories/clubRepository";

export const dynamic = "force-dynamic";

function isIntranetClubsRouteRole(r: string | undefined): r is IntranetRole {
  return Boolean(r && (INTRANET_ROLES as readonly string[]).includes(r));
}

/** `club_id` / `clubId` en JWT: null, vacío, "null" → sin tenant. */
function resolvedClubIdFromMetadata(meta: Record<string, unknown>): string | null {
  const raw = meta.club_id ?? meta.clubId;
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") return null;
  return s;
}

function resolvedLeagueIdFromMetadata(meta: Record<string, unknown>): string | null {
  const raw = meta.league_id ?? meta.leagueId;
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") return null;
  return s;
}

function resolvedClubSlugFromMetadata(meta: Record<string, unknown>): string {
  const raw = meta.club_slug ?? meta.clubSlug;
  if (typeof raw !== "string") return "";
  return raw.trim();
}

export default async function ClubsPage() {
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

  const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const appRole = typeof meta.role === "string" ? meta.role : undefined;

  if (!isIntranetClubsRouteRole(appRole)) {
    redirect("/liga/");
  }

  const clubIdMeta = resolvedClubIdFromMetadata(meta);
  const clubSlugMeta = resolvedClubSlugFromMetadata(meta);
  const leagueIdMeta = resolvedLeagueIdFromMetadata(meta);

  // Delegado: esta ruta no lista clubes; va a la intranet del club o al panel hasta que staff asigne club.
  if (appRole === "CLUB_DELEGATE") {
    if (clubIdMeta) {
      const slug =
        clubSlugMeta || (await clubRepository.findById(clubIdMeta))?.slug || "";
      if (slug) redirect(`/${slug}/`);
    }
    redirect("/liga/");
  }

  // SUPER_ADMIN / LEAGUE_ADMIN: listado y creación
  let rawClubs: (typeof clubs.$inferSelect)[] = [];
  if (appRole === "SUPER_ADMIN") {
    rawClubs = await getCachedClubs({
      bypassClubFilter: true,
      actingRole: "SUPER_ADMIN",
    });
  } else if (appRole === "LEAGUE_ADMIN") {
    rawClubs = leagueIdMeta
      ? await getCachedClubs({ leagueId: leagueIdMeta, actingRole: "LEAGUE_ADMIN" })
      : [];
  }

  const listaClubs = rawClubs.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    sede: c.courtAddress,
    contacto: c.adminPhone,
    row: c,
  }));

  const canUseGlobalClubToolbar = appRole === "SUPER_ADMIN" || appRole === "LEAGUE_ADMIN";

  if (listaClubs.length === 0) {
    return (
      <div className="space-y-4">
        {canUseGlobalClubToolbar && (
          <div className="flex items-center justify-end">
            <CrearClubModal />
          </div>
        )}
        <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Sin clubes en este contexto</h2>
          <p className="max-w-md text-sm text-slate-500">
            {appRole === "LEAGUE_ADMIN" && !leagueIdMeta
              ? "Tu cuenta de administrador de liga no tiene una liga asignada (league_id). Contacta a un super administrador."
              : "Aún no hay clubes registrados. Puedes crear el primero con el botón superior."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canUseGlobalClubToolbar && (
        <div className="flex items-center justify-end">
          <CrearClubModal />
        </div>
      )}
      <section className="space-y-3 rounded-2xl border border-[#BFDBFE] bg-white p-5 shadow-[0_20px_50px_-35px_rgba(59,130,246,0.6)]">
        <h2 className="text-lg font-bold text-slate-900">Sección CLUBS</h2>
        <p className="text-sm text-slate-500">
          Administra tus clubes y crea la estructura base para categorías y players.
        </p>
        <div className="space-y-2">
          {listaClubs.map((club) => (
            <div
              key={club.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3"
            >
              <div>
                <p className="font-medium text-slate-900">{club.name}</p>
                <p className="text-xs text-slate-500">
                  {club.sede || "Sin sede"} · {club.contacto || "Sin contacto"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/liga/clubs/${club.id}`}
                  className="rounded-lg bg-[#005CEE] px-3 py-1.5 text-sm font-semibold text-white shadow-sm"
                >
                  Categorías
                </Link>
                <EditarClubModal club={club.row} />
                <form action={eliminarClubFormAction}>
                  <input type="hidden" name="clubId" value={club.id} />
                  <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
