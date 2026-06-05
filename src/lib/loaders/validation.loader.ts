import type { PlayerStatus } from "@/lib/db/schema";
import { resolvePublicImageUrl } from "@/lib/validar/resolve-public-image-url";
import { lineaCategoriaInstitucional } from "@/lib/utils/categoriaFicha";
import { categoryRepository } from "@/repositories/categoryRepository";
import { playerRepository } from "@/repositories/playerRepository";

export async function loadPlayerValidation(entityId: string) {
  return playerRepository.findValidationById(entityId);
}

export async function loadCategoryValidation(entityId: string) {
  return categoryRepository.findValidationById(entityId);
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
  const context = await categoryRepository.findValidationContextById(categoryId);
  if (!context) return null;

  const roster = await playerRepository.findValidationRosterByCategoryId(categoryId);

  const categoriaDisplay = lineaCategoriaInstitucional(
    context.categoriaNombre,
    roster.map((p) => p.gender),
  );

  return {
    leagueName: context.leagueName,
    clubName: context.clubName,
    categoriaDisplay,
    players: roster.map((p) => ({
      id: p.id,
      playerName: `${p.lastname}, ${p.name}`.toUpperCase(),
      jerseyNumber: p.jerseyNumber,
      photoUrl: resolvePublicImageUrl(p.photoUrl),
      status: p.status ?? "PENDIENTE_PAGO",
    })),
  };
}
