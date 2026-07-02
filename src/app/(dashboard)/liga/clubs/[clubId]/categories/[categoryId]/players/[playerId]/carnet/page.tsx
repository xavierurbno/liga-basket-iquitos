import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { buildCarnetVistaPreviaPropsServer } from "@/lib/carnet/build-carnet-vista-previa-props.server";
import { loadCarnetPage } from "@/lib/loaders/category-page.loader";
import { CarnetConfigAlert } from "@/components/carnet/CarnetConfigAlert";
import { CarnetEmissionPanel } from "@/components/carnet/CarnetEmissionPanel";
import { CarnetPrintGuide } from "@/components/carnet/CarnetPrintGuide";
import { CarnetVistaPrevia } from "@/components/carnet/CarnetVistaPrevia";
import {
  buildCarnetLeagueReadiness,
  buildPlayerCarnetWarnings,
} from "@/lib/carnet/carnetLeagueReadiness";
import { CARNET_THEME_PRESET_LABELS, resolveCarnetThemeConfig } from "@/lib/carnet/carnetTheme";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";
import type { AuthContext } from "@/lib/auth/withAuth";
import { withOperationalRead } from "@/lib/db/operational-db-access";
import { labelCarnetCategorySegment } from "@/lib/leagues/league-carnet-prefix";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";
import { settingsRepository } from "@/repositories/settingsRepository";
import { leagueRepository } from "@/repositories/league.repository";

function aIso(transactionDate: Date | null | undefined): string {
  if (!transactionDate) return "";
  const t = new Date(transactionDate);
  if (Number.isNaN(t.getTime())) return "";
  return t.toISOString();
}

export default async function CarnetJugadorPage({
  params,
}: {
  params: Promise<{ clubId: string; categoryId: string; playerId: string }>;
}) {
  const { clubId, categoryId, playerId } = await params;

  const loaded = await loadCarnetPage(clubId, categoryId, playerId);
  if (!loaded) redirect("/liga/clubs");
  const { club, category, jugador } = loaded;
  if (!category) redirect(`/liga/clubs/${clubId}`);
  if (!jugador) redirect(`/liga/clubs/${clubId}/categories/${categoryId}`);

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const operationalLeagueId = user ? resolveOperationalLeagueId(user, cookieStore) : null;

  const authContext: AuthContext | null = user
    ? {
        userId: user.id,
        role: user.app_metadata?.role as AuthContext["role"],
        clubId: user.app_metadata?.club_id as string | undefined,
        leagueId:
          operationalLeagueId ?? (user.app_metadata?.league_id as string | undefined),
      }
    : null;

  const leagueRow =
    club.leagueId?.trim() && user && authContext
      ? await withOperationalRead(user, authContext, (tx) =>
          leagueRepository.findById(club.leagueId!.trim(), tx),
        )
      : null;

  const carnetVistaProps = await buildCarnetVistaPreviaPropsServer({
    jugador: {
      id: jugador.id,
      name: jugador.name,
      lastname: jugador.lastname,
      documentType: jugador.documentType,
      documentNumber: jugador.documentNumber,
      birthdate: jugador.birthdate,
      photoUrl: jugador.photoUrl,
      carnetNumber: jugador.carnetNumber,
      gender: jugador.gender,
    },
    club: {
      name: club.name,
      logoUrl: club.logoUrl,
      federationCode: club.federationCode,
      leagueId: club.leagueId,
    },
    categoryName: category.name,
    operationalLeagueId,
    leagueSlug: leagueRow?.slug,
    leagueName: leagueRow?.name,
    presentationMode: "emision",
  });

  const effectiveLeagueId = carnetVistaProps.leagueId?.trim() || null;
  const leagueSettings =
    effectiveLeagueId && user && authContext
      ? await withOperationalRead(user, authContext, (tx) =>
          settingsRepository.getLeagueSettings(effectiveLeagueId, tx),
        )
      : null;
  const carnetTheme = resolveCarnetThemeConfig(leagueSettings);
  const carnetPresetLabel = CARNET_THEME_PRESET_LABELS[carnetTheme.preset];

  const categoriaDetalle = lineaCategoriaInstitucional(category.name, [jugador.gender]);
  const carnetDisplay = carnetVistaProps.carnetNumberDisplay;
  const carnetParts = carnetDisplay?.split("-") ?? [];
  const categorySegment = carnetParts[2] ?? null;
  const cityPrefix = carnetVistaProps.leagueSportsCode ?? "—";
  const leagueDisplayName = carnetVistaProps.leagueDisplayName;
  const fotoPublica = carnetVistaProps.photoUrl;
  const validationUrl = carnetVistaProps.validationUrl;
  const fileName = `carnet-${club.slug}-${jugador.documentNumber}`.replace(/[^a-zA-Z0-9._-]/g, "-");

  const { hasLeagueMonoLogoAvailable } = await import(
    "@/lib/logos/resolve-league-logo-buffer"
  );
  const leagueReadiness = buildCarnetLeagueReadiness(
    leagueSettings,
    Boolean(carnetVistaProps.leagueLogoUrl),
    Boolean(carnetVistaProps.federacionLogoUrl),
    carnetTheme.preset,
    await hasLeagueMonoLogoAvailable(effectiveLeagueId),
  );
  const playerWarnings = buildPlayerCarnetWarnings({
    hasPhoto: Boolean(fotoPublica),
    hasCarnetNumber: Boolean(carnetDisplay),
  });
  const credentialVersion = jugador.credentialVersion ?? 0;
  const credentialIssuedAt = jugador.credentialIssuedAt
    ? jugador.credentialIssuedAt.toISOString()
    : null;
  const blockingWarnings = leagueReadiness.warnings.filter((w) => w.severity === "warning");
  const canEmitCarnet = leagueReadiness.ready && Boolean(fotoPublica);
  const emitBlockReason = !leagueReadiness.ready
    ? blockingWarnings.length > 0
      ? `Falta en configuración: ${blockingWarnings.map((w) => w.message).join(" · ")}`
      : "Completa la configuración del carnet en ajustes de liga."
    : !fotoPublica
      ? "Sube la foto del deportista."
      : null;
  const settingsHref = "/liga/configuracion/#carnet-settings";
  const superAdminSettingsHref = effectiveLeagueId
    ? `/super-admin/leagues/${effectiveLeagueId}#carnet-settings`
    : settingsHref;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{club.name}</p>
          <h1 className="text-xl font-bold text-slate-900">
            Carnet — {jugador.lastname}, {jugador.name}
          </h1>
          <p className="text-sm text-slate-600">{categoriaDetalle}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Plantilla de liga: <strong>{carnetPresetLabel}</strong> (
            <code className="font-mono">{carnetTheme.preset}</code>)
          </p>
        </div>
        <Link
          href={`/liga/clubs/${clubId}/categories/${categoryId}`}
          className="rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-sm"
        >
          Volver
        </Link>
      </div>
      <CarnetConfigAlert
        warnings={[...leagueReadiness.warnings, ...playerWarnings]}
        settingsHref={settingsHref}
      />

      <section className="rounded-2xl border border-[#BFDBFE] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Vista previa del carnet</h2>
        <CarnetVistaPrevia {...carnetVistaProps} />
      </section>

      <div className="rounded-2xl border border-[#BFDBFE] bg-white p-6 shadow-sm">
        <div className="flex gap-4">
          <div className="relative h-28 w-18 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {fotoPublica ? (
              <Image src={fotoPublica} alt="" fill className="object-cover" sizes="72px" />
            ) : (
              <p className="flex h-full items-center justify-center text-xs text-slate-400">Sin foto</p>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1 text-sm">
            <p className="font-bold text-slate-900">
              {jugador.documentType}: {jugador.documentNumber}
            </p>
            <p className="text-slate-600">
              Nac.{" "}
              {jugador.birthdate
                ? new Date(jugador.birthdate).toLocaleDateString("es-PE")
                : "—"}
            </p>
            {carnetDisplay ? (
              <div className="space-y-1">
                <p className="font-mono text-xs font-semibold text-[#2563EB]">
                  N° {carnetDisplay}
                </p>
                <p className="text-[10px] leading-snug text-slate-500">
                  <span className="font-semibold text-slate-600">{cityPrefix}</span> = sede (
                  {leagueDisplayName}) ·{" "}
                  <span className="font-semibold text-slate-600">
                    {categorySegment ?? "—"}
                  </span>{" "}
                  = {categorySegment ? labelCarnetCategorySegment(categorySegment) : "categoría"}
                </p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-6 space-y-4 print:hidden">
          {!leagueReadiness.ready ? (
            <p className="text-center text-[11px] font-medium text-amber-800">
              Completa la configuración del carnet en{" "}
              <a href={superAdminSettingsHref} className="font-bold underline">
                ajustes de liga
              </a>{" "}
              para completar el reverso del carnet según la configuración de la liga.
            </p>
          ) : null}
          <CarnetEmissionPanel
            playerId={jugador.id}
            clubId={clubId}
            categoryId={categoryId}
            credentialVersion={credentialVersion}
            credentialIssuedAt={credentialIssuedAt}
            validationUrl={validationUrl}
            canEmit={canEmitCarnet}
            emitBlockReason={emitBlockReason}
            needsCarnetNumber={!carnetDisplay}
            pdfProps={{
              leagueId: effectiveLeagueId,
              leagueDisplayName,
              playerId: jugador.id,
              fileName,
              name: jugador.name,
              lastname: jugador.lastname,
              documentType: jugador.documentType,
              documentNumber: jugador.documentNumber,
              fechaNacimientoIso: aIso(jugador.birthdate),
              gender: jugador.gender,
              clubName: club.name,
              federationSportsCode: club.federationCode,
              leagueSportsCode: cityPrefix,
              categoriaDetalle: carnetVistaProps.categoriaNombre,
              carnetNumber: jugador.carnetNumber,
              carnetNumberDisplay: carnetDisplay,
              photoUrl: fotoPublica,
              clubLogoUrl: club.logoUrl,
              validationUrl,
              credentialIssuedAtIso: credentialIssuedAt,
              credentialVersion,
            }}
          />
          <CarnetPrintGuide />
        </div>
      </div>
    </div>
  );
}
