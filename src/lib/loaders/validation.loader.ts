import type { PlayerStatus } from "@/lib/db/schema";
import { unauthenticatedReadDb } from "@/lib/db/operational-db-access";
import { resolvePlayerPhotoUrl } from "@/lib/storage/player-photo-url.server";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";
import { categoryRepository } from "@/repositories/categoryRepository";
import { playerRepository } from "@/repositories/playerRepository";

export async function loadPlayerValidation(entityId: string) {
  const publicDb = unauthenticatedReadDb();
  return playerRepository.findValidationById(entityId, publicDb);
}

export async function loadCategoryValidation(entityId: string) {
  const publicDb = unauthenticatedReadDb();
  return categoryRepository.findValidationById(entityId, publicDb);
}

export type CategoryRosterValidationPlayer = {
  id: string;
  playerName: string;
  jerseyNumber: number | null;
  photoUrl: string | null;
  status: PlayerStatus;
};

export type CategoryRosterValidation = {
  leagueName: string | null;
  clubName: string;
  /** Línea institucional (ej. U15 MASCULINO). */
  categoriaDisplay: string;
  players: CategoryRosterValidationPlayer[];
};

export async function loadCategoryRosterValidation(
  categoryId: string,
): Promise<CategoryRosterValidation | null> {
  const publicDb = unauthenticatedReadDb();
  const context = await categoryRepository.findValidationContextById(categoryId, publicDb);
  if (!context) return null;

  const roster = await playerRepository.findValidationRosterByCategoryId(categoryId, publicDb);

  const categoriaDisplay = lineaCategoriaInstitucional(
    context.categoriaNombre,
    roster.map((p) => p.gender),
  );

  return {
    leagueName: context.leagueName,
    clubName: context.clubName,
    categoriaDisplay,
    players: await Promise.all(
      roster.map(async (p) => ({
        id: p.id,
        playerName: `${p.lastname}, ${p.name}`.toUpperCase(),
        jerseyNumber: p.jerseyNumber,
        photoUrl: await resolvePlayerPhotoUrl(p.photoUrl, { intent: "public" }),
        status: p.status ?? "PENDIENTE_PAGO",
      })),
    ),
  };
}
