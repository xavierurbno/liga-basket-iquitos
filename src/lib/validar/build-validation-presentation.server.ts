import "server-only";

import { buildCarnetVistaPreviaPropsServer } from "@/lib/carnet/build-carnet-vista-previa-props.server";
import type { CarnetPlayerGender } from "@/lib/types/carnet";
import type { FichaVistaPreviaProps } from "@/lib/types/ficha";
import { resolveFichaInstitutionalBranding } from "@/lib/leagues/ficha-institutional-branding.server";
import { normalizePortalHexColor } from "@/lib/leagues/portal-colors";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";
import { maskDocumentNumber } from "@/lib/observability/mask-document-number";
import { resolvePlayerPhotoUrl } from "@/lib/storage/player-photo-url.server";
import { resolvePublicImageUrl } from "@/lib/validar/resolve-public-image-url";
import { unauthenticatedReadDb } from "@/lib/db/operational-db-access";
import { categoryRepository } from "@/repositories/categoryRepository";
import { clubRepository } from "@/repositories/clubRepository";
import { playerRepository } from "@/repositories/playerRepository";
import { settingsRepository } from "@/repositories/settingsRepository";
import type { PlayerStatus } from "@/lib/db/schema";

async function resolveLeagueFichaBranding(leagueId: string | null | undefined) {
  return resolveFichaInstitutionalBranding(leagueId);
}

export async function loadCategoryFichaValidation(categoryId: string): Promise<{
  ficha: FichaVistaPreviaProps;
  estadosPorJugador: Record<string, PlayerStatus | null | undefined>;
  leagueName: string | null;
  accentColor: string;
} | null> {
  const publicDb = unauthenticatedReadDb();
  const context = await categoryRepository.findValidationContextById(categoryId, publicDb);
  if (!context) return null;

  const [staff, jugadores, roster] = await Promise.all([
    categoryRepository.findFichaStaffByIdAndClub(categoryId, context.clubId, publicDb),
    playerRepository.findForFichaByCategory(context.clubId, categoryId, publicDb),
    playerRepository.findValidationRosterByCategoryId(categoryId, publicDb),
  ]);

  if (!staff) return null;

  const clubRow = await clubRepository.findFichaClub(context.clubId, publicDb);

  const effectiveLeagueId = clubRow?.leagueId?.trim() || null;
  const fichaBranding = await resolveLeagueFichaBranding(effectiveLeagueId);
  const {
    leagueDisplayName,
    leagueLogoUrl,
    leagueSlug,
    showFederation,
    federationDisplayName,
    federacionLogoUrl,
  } = fichaBranding;

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

  const players = await Promise.all(
    jugadores.map(async (j) => ({
      id: j.id,
      name: j.name,
      lastname: j.lastname,
      documentType: j.documentType,
      documentNumber: maskDocumentNumber(j.documentNumber),
      fechaNacimientoIso: j.birthdate
        ? String(new Date(j.birthdate).getFullYear())
        : "",
      photoUrl: await resolvePlayerPhotoUrl(j.photoUrl, { intent: "public" }),
      jerseyNumber: j.jerseyNumber,
    })),
  );

  return {
    leagueName: context.leagueName,
    accentColor,
    estadosPorJugador,
    ficha: {
      leagueDisplayName,
      leagueLogoUrl,
      leagueSlug,
      showFederation,
      federationDisplayName,
      federacionLogoUrl,
      clubName: context.clubName,
      clubLogoUrl: resolvePublicImageUrl(clubRow?.logoUrl ?? null),
      categoriaDetalle,
      players,
      entrenador: {
        name: staff.coachName,
        lastname: staff.coachLastname,
        documentType: staff.coachDocumentType,
        documentNumber: maskDocumentNumber(staff.coachDocumentNumber),
        photoUrl: resolvePublicImageUrl(staff.coachPhotoUrl),
      },
      delegado: {
        name: staff.delegateName,
        lastname: staff.delegateLastname,
        documentType: staff.delegateDocumentType,
        documentNumber: maskDocumentNumber(staff.delegateDocumentNumber),
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
  const publicDb = unauthenticatedReadDb();
  const jugador = await playerRepository.findCarnetValidationById(playerId, publicDb);
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
