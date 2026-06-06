import "server-only";

import { buildCarnetVistaPreviaPropsServer } from "@/lib/carnet/build-carnet-vista-previa-props.server";
import type { CarnetPlayerGender } from "@/lib/types/carnet";
import type { FichaVistaPreviaProps } from "@/lib/types/ficha";
import { loadLeaguePortalBranding } from "@/lib/leagues/league-branding";
import { normalizePortalHexColor } from "@/lib/leagues/portal-colors";
import { resolveLeagueDisplayLogoUrl } from "@/lib/logos/resolve-public-league-logo.server";
import { FICHA_T2 } from "@/lib/pdf/fichaInstitucionalTextos";
import { isPrimaryPortalLeagueSlug } from "@/lib/portal/portal-league-constants";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";
import { resolvePublicImageUrl } from "@/lib/validar/resolve-public-image-url";
import { categoryRepository } from "@/repositories/categoryRepository";
import { clubRepository } from "@/repositories/clubRepository";
import { leagueRepository } from "@/repositories/league.repository";
import { playerRepository } from "@/repositories/playerRepository";
import { settingsRepository } from "@/repositories/settingsRepository";
import type { PlayerStatus } from "@/lib/db/schema";

function aIso(date: Date | null | undefined): string {
  if (!date) return "";
  const t = new Date(date);
  if (Number.isNaN(t.getTime())) return "";
  return t.toISOString();
}

async function resolveLeagueFichaBranding(leagueId: string | null | undefined) {
  let leagueDisplayName = FICHA_T2;
  let leagueLogoUrl = "/logos/liga.png";

  if (!leagueId?.trim()) {
    return { leagueDisplayName, leagueLogoUrl };
  }

  const leagueRow = await leagueRepository.findById(leagueId);
  if (!leagueRow) return { leagueDisplayName, leagueLogoUrl };

  const branding = await loadLeaguePortalBranding(leagueRow);
  leagueDisplayName = branding.name;
  const resolvedLogo = await resolveLeagueDisplayLogoUrl({
    slug: leagueRow.slug,
    loginLogoUrl: branding.logoUrl,
  });
  leagueLogoUrl =
    resolvedLogo ?? (isPrimaryPortalLeagueSlug(leagueRow.slug) ? "/logos/liga.png" : "");

  return { leagueDisplayName, leagueLogoUrl };
}

export async function loadCategoryFichaValidation(categoryId: string): Promise<{
  ficha: FichaVistaPreviaProps;
  estadosPorJugador: Record<string, PlayerStatus | null | undefined>;
  leagueName: string | null;
  accentColor: string;
} | null> {
  const context = await categoryRepository.findValidationContextById(categoryId);
  if (!context) return null;

  const [staff, jugadores, roster] = await Promise.all([
    categoryRepository.findFichaStaffByIdAndClub(categoryId, context.clubId),
    playerRepository.findForFichaByCategory(context.clubId, categoryId),
    playerRepository.findValidationRosterByCategoryId(categoryId),
  ]);

  if (!staff) return null;

  const clubRow = await clubRepository.findFichaClub(context.clubId);

  const effectiveLeagueId = clubRow?.leagueId?.trim() || null;
  const { leagueDisplayName, leagueLogoUrl } = await resolveLeagueFichaBranding(effectiveLeagueId);

  let accentColor = "#0d9488";
  if (effectiveLeagueId) {
    const settings = await settingsRepository.getLeagueSettings(effectiveLeagueId);
    accentColor = normalizePortalHexColor(settings?.portalAccentColor, "#0d9488");
  }

  const categoriaDetalle = lineaCategoriaInstitucional(
    context.categoriaNombre,
    jugadores.map((j) => j.gender),
  );

  const estadosPorJugador: Record<string, PlayerStatus | null | undefined> = {};
  for (const p of roster) {
    estadosPorJugador[p.id] = p.status ?? "PENDIENTE_PAGO";
  }

  const players = jugadores.map((j) => ({
    id: j.id,
    name: j.name,
    lastname: j.lastname,
    documentType: j.documentType,
    documentNumber: j.documentNumber,
    fechaNacimientoIso: aIso(j.birthdate),
    photoUrl: resolvePublicImageUrl(j.photoUrl),
    jerseyNumber: j.jerseyNumber,
  }));

  return {
    leagueName: context.leagueName,
    accentColor,
    estadosPorJugador,
    ficha: {
      leagueDisplayName,
      leagueLogoUrl,
      clubName: context.clubName,
      clubLogoUrl: resolvePublicImageUrl(clubRow?.logoUrl ?? null),
      categoriaDetalle,
      players,
      entrenador: {
        name: staff.coachName,
        lastname: staff.coachLastname,
        documentType: staff.coachDocumentType,
        documentNumber: staff.coachDocumentNumber,
        photoUrl: resolvePublicImageUrl(staff.coachPhotoUrl),
      },
      delegado: {
        name: staff.delegateName,
        lastname: staff.delegateLastname,
        documentType: staff.delegateDocumentType,
        documentNumber: staff.delegateDocumentNumber,
        photoUrl: resolvePublicImageUrl(staff.delegatePhotoUrl),
      },
    },
  };
}

export async function loadPlayerCarnetValidation(playerId: string): Promise<{
  carnetProps: Awaited<ReturnType<typeof buildCarnetVistaPreviaPropsServer>>;
  status: PlayerStatus | null | undefined;
  leagueName: string | null;
  accentColor: string;
} | null> {
  const jugador = await playerRepository.findCarnetValidationById(playerId);
  if (!jugador) return null;
  if (!jugador.categoriaNombre) return null;

  const carnetProps = await buildCarnetVistaPreviaPropsServer({
    jugador: {
      id: jugador.id,
      name: jugador.name,
      lastname: jugador.lastname,
      documentType: jugador.documentType,
      documentNumber: jugador.documentNumber,
      birthdate: jugador.birthdate,
      photoUrl: jugador.photoUrl,
      carnetNumber: jugador.carnetNumber,
      gender: jugador.gender as CarnetPlayerGender,
    },
    club: {
      name: jugador.clubName,
      logoUrl: jugador.clubLogoUrl,
      federationCode: jugador.federationCode,
      leagueId: jugador.leagueId,
      joinedLeagueId: jugador.joinedLeagueId,
    },
    categoryName: jugador.categoriaNombre,
    leagueSlug: jugador.leagueSlug,
    leagueName: jugador.leagueName,
    presentationMode: "validacion",
  });

  return {
    leagueName: jugador.leagueName,
    accentColor: carnetProps.portalAccentColor ?? "#0d9488",
    status: jugador.status,
    carnetProps,
  };
}
