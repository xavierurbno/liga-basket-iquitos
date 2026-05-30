import { clubRepository } from "@/repositories/clubRepository";
import { categoryRepository } from "@/repositories/categoryRepository";
import { playerRepository } from "@/repositories/playerRepository";

export async function loadCategoryDetailPage(clubId: string, categoryId: string) {
  const club = await clubRepository.findCategoryDetailClub(clubId);
  if (!club) return null;

  const category = await categoryRepository.findByIdAndClub(categoryId, clubId);
  if (!category) return { club, category: null as const, listaJugadores: [] };

  const listaJugadores = await playerRepository.findRosterByCategory(clubId, categoryId);
  return { club, category, listaJugadores };
}

export async function loadFichaCategoryPage(clubId: string, categoryId: string) {
  const club = await clubRepository.findFichaClub(clubId);
  if (!club) return null;

  const category = await categoryRepository.findFichaStaffByIdAndClub(categoryId, clubId);
  if (!category) return { club, category: null as const, listaJugadores: [] };

  const listaJugadores = await playerRepository.findForFichaByCategory(clubId, categoryId);
  return { club, category, listaJugadores };
}

export async function loadNewPlayerPage(clubId: string, categoryId: string) {
  const club = await clubRepository.findNameById(clubId);
  if (!club) return null;
  const category = await categoryRepository.findNameByIdAndClub(categoryId, clubId);
  if (!category) return { club, category: null as const };
  return { club, category };
}

export async function loadCarnetPage(
  clubId: string,
  categoryId: string,
  playerId: string,
) {
  const club = await clubRepository.findCarnetClub(clubId);
  if (!club) return null;

  const category = await categoryRepository.findNameByIdAndClub(categoryId, clubId);
  if (!category) return { club, category: null as const, jugador: null as const };

  const jugador = await playerRepository.findForCarnet(playerId, clubId, categoryId);
  return { club, category, jugador };
}
