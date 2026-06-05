import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { loadCarnetPage } from "@/lib/loaders/category-page.loader";
import { CarnetConfigAlert } from "@/components/carnet/CarnetConfigAlert";
import { CarnetEmissionPanel } from "@/components/carnet/CarnetEmissionPanel";
import { CarnetPrintGuide } from "@/components/carnet/CarnetPrintGuide";
import { CarnetVistaPrevia } from "@/components/carnet/CarnetVistaPrevia";
import {
  buildCarnetLeagueReadiness,
  buildPlayerCarnetWarnings,
} from "@/lib/carnet/carnetLeagueReadiness";
import { buildPlayerValidationUrl } from "@/lib/validation/build-validation-url.server";
import { isLddbiCarnetPreset } from "@/lib/carnet/lddbiTemplateLayout";
import {
  LDDBI_PREMIUM_ACCENT_HEX,
  LDDBI_PREMIUM_PRIMARY_HEX,
} from "@/lib/carnet/lddbiPremiumTheme";
import {
  CARNET_THEME_PRESET_LABELS,
  parseCarnetThemePreset,
  resolveCarnetThemeConfig,
} from "@/lib/carnet/carnetTheme";
import {
  buildCarnetAuthorizationText,
  resolveCarnetValidityLabel,
} from "@/lib/carnet/carnetInstitucionalText";
import { normalizePortalHexColor } from "@/lib/leagues/league-branding";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";
import { settingsRepository } from "@/repositories/settingsRepository";
import { resolveOperationalLeagueId } from "@/lib/auth/resolve-league-id";
import { leagueRepository } from "@/repositories/league.repository";
import {
  formatCarnetNumberForLeague,
  labelCarnetCategorySegment,
  resolveLeagueCarnetPrefix,
} from "@/lib/leagues/league-carnet-prefix";

function aIso(transactionDate: Date | null | undefined): string {
  if (!transactionDate) return "";
  const t = new Date(transactionDate);
  if (Number.isNaN(t.getTime())) return "";
  return t.toISOString();
}

function resolvePublicImageUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  if (rawUrl.includes("/storage/v1/object/sign/")) {
    const [withoutQuery] = rawUrl.split("?");
    return withoutQuery.replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
  }
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const key = rawUrl.replace(/^\/+/, "");
  const hasBucket = key.startsWith("jugador-fotos/") || key.startsWith("club-assets/");
  if (hasBucket) return `${supabaseUrl}/storage/v1/object/public/${key}`;
  return `${supabaseUrl}/storage/v1/object/public/jugador-fotos/${key}`;
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
  const effectiveLeagueId = club.leagueId?.trim() || operationalLeagueId;
  const leagueRow = effectiveLeagueId
    ? await leagueRepository.findById(effectiveLeagueId)
    : null;
  const cityPrefix = resolveLeagueCarnetPrefix({
    slug: leagueRow?.slug,
    name: leagueRow?.name,
  });
  const leagueDisplayName = leagueRow?.name ?? "Liga deportiva";
  const carnetDisplay = formatCarnetNumberForLeague(jugador.carnetNumber, cityPrefix);
  const carnetParts = carnetDisplay?.split("-") ?? [];
  const categorySegment = carnetParts[2] ?? null;

  const categoriaDetalle = lineaCategoriaInstitucional(category.name, [jugador.gender]);
  /** En carnet: solo nombre de categoría (el género va en su fila; evita "MIXTO" repetido). */
  const categoriaCarnet = category.name.trim();
  const fotoPublica = resolvePublicImageUrl(jugador.photoUrl);
  const fileName = `carnet-${club.slug}-${jugador.documentNumber}`.replace(/[^a-zA-Z0-9._-]/g, "-");

  const leagueSettings = effectiveLeagueId
    ? await settingsRepository.getLeagueSettings(effectiveLeagueId)
    : null;
  const leagueLogoUrl = resolvePublicImageUrl(leagueSettings?.loginLogoUrl ?? null);
  const showFederation = leagueSettings?.carnetShowFederation !== false;
  const federacionLogoUrl = showFederation
    ? resolvePublicImageUrl(leagueSettings?.carnetFederationLogoUrl ?? null) ??
      "/logos/federacion.png"
    : null;
  const carnetSportGraphicUrl = resolvePublicImageUrl(
    leagueSettings?.carnetSportGraphicUrl ?? null,
  );
  const presidentSignatureUrl = resolvePublicImageUrl(
    leagueSettings?.presidentSignatureUrl ?? null,
  );
  const secretarySignatureUrl = resolvePublicImageUrl(
    leagueSettings?.secretarySignatureUrl ?? null,
  );
  const carnetTheme = resolveCarnetThemeConfig(leagueSettings);
  const carnetPresetLabel = CARNET_THEME_PRESET_LABELS[carnetTheme.preset];
  const authorizationText = buildCarnetAuthorizationText(
    leagueDisplayName,
    leagueSettings?.carnetAuthorizationTemplate,
    { lddbiPreset: isLddbiCarnetPreset(carnetTheme.preset) },
  );
  const vigenciaLabel = resolveCarnetValidityLabel(
    leagueSettings?.carnetValidityLabel,
    leagueSettings?.seasonName,
  );
  const validationUrl = buildPlayerValidationUrl(jugador.id, "");
  const portalPrimaryColor =
    isLddbiCarnetPreset(carnetTheme.preset)
      ? LDDBI_PREMIUM_PRIMARY_HEX
      : normalizePortalHexColor(leagueSettings?.portalPrimaryColor, "#1e3a5f");
  const portalAccentColor = isLddbiCarnetPreset(carnetTheme.preset)
    ? LDDBI_PREMIUM_ACCENT_HEX
    : normalizePortalHexColor(leagueSettings?.portalAccentColor, "#0d9488");
  const fechaNacimientoLabel = jugador.birthdate
    ? new Date(jugador.birthdate).toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  const leagueReadiness = buildCarnetLeagueReadiness(
    leagueSettings,
    Boolean(leagueLogoUrl),
    Boolean(federacionLogoUrl),
    carnetTheme.preset,
  );
  const playerWarnings = buildPlayerCarnetWarnings({
    hasPhoto: Boolean(fotoPublica),
    hasCarnetNumber: Boolean(carnetDisplay),
  });
  const credentialVersion = jugador.credentialVersion ?? 0;
  const credentialIssuedAt = jugador.credentialIssuedAt
    ? jugador.credentialIssuedAt.toISOString()
    : null;
  const canEmitCarnet =
    leagueReadiness.ready && Boolean(fotoPublica) && Boolean(carnetDisplay);
  const emitBlockReason = !leagueReadiness.ready
    ? "Completa la configuración del carnet en ajustes de liga."
    : !fotoPublica
      ? "Sube la foto del deportista."
      : !carnetDisplay
        ? "El deportista no tiene número de carnet."
        : null;
  const settingsHref = effectiveLeagueId
    ? `/liga/configuracion/#carnet-settings`
    : "/liga/configuracion/#carnet-settings";
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
        <CarnetVistaPrevia
        leagueId={effectiveLeagueId}
        playerId={jugador.id}
        leagueDisplayName={leagueDisplayName}
        clubLogoUrl={resolvePublicImageUrl(club.logoUrl)}
        documentType={jugador.documentType}
        fechaNacimientoIso={
          jugador.birthdate ? new Date(jugador.birthdate).toISOString() : ""
        }
        categoriaDetalle={categoriaDetalle}
        leagueLogoUrl={leagueLogoUrl}
        federacionLogoUrl={federacionLogoUrl}
        photoUrl={fotoPublica}
        name={jugador.name}
        lastname={jugador.lastname}
        documentNumber={jugador.documentNumber}
        fechaNacimientoLabel={fechaNacimientoLabel}
        gender={jugador.gender}
        clubName={club.name}
        federationSportsCode={club.federationCode}
        leagueSportsCode={cityPrefix}
        categoriaNombre={categoriaCarnet}
        carnetNumberDisplay={carnetDisplay}
        presidentDisplayName={leagueSettings?.presidentDisplayName ?? ""}
        secretaryDisplayName={leagueSettings?.secretaryDisplayName ?? ""}
        presidentSignatureUrl={presidentSignatureUrl}
        secretarySignatureUrl={secretarySignatureUrl}
        authorizationText={authorizationText}
        vigenciaLabel={vigenciaLabel}
        validationUrl={validationUrl}
        portalPrimaryColor={portalPrimaryColor}
        portalAccentColor={portalAccentColor}
        carnetThemePreset={parseCarnetThemePreset(leagueSettings?.carnetThemePreset)}
        carnetShowFederation={showFederation}
        carnetFederationDisplayName={leagueSettings?.carnetFederationDisplayName}
        carnetSportLabel={leagueSettings?.carnetSportLabel}
        carnetSportGraphicUrl={carnetSportGraphicUrl}
        />
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
              para un reverso con firmas oficiales.
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
              categoriaDetalle: categoriaCarnet,
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
