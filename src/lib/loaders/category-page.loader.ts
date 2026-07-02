import { withQueryTimeout } from "@/lib/db/query-timeout";
import { resolveIntranetAuthSession } from "@/lib/auth/auth-session";
import { withIntranetRead } from "@/lib/db/with-intranet-read";
import { clubRepository } from "@/repositories/clubRepository";
import { categoryRepository } from "@/repositories/categoryRepository";
import { playerRepository } from "@/repositories/playerRepository";

const PAGE_LOADER_TIMEOUT_MS = 15_000;

async function withIntranetReadTx<T>(fn: Parameters<typeof withIntranetRead<T>>[0]): Promise<T | null> {
  return withIntranetRead(fn);
}

export async function loadCategoryDetailPage(clubId: string, categoryId: string) {
  return withIntranetReadTx(async (tx) => {
    const club = await clubRepository.findCategoryDetailClub(clubId, tx);
    if (!club) return null;

    const category = await categoryRepository.findByIdAndClub(categoryId, clubId, tx);
    if (!category) return { club, category: null, listaJugadores: [] };

    const listaJugadores = await playerRepository.findRosterByCategory(clubId, categoryId, tx);
    return { club, category, listaJugadores };
  });
}

export async function loadFichaCategoryPage(clubId: string, categoryId: string) {
  try {
    return await withQueryTimeout(
      loadFichaCategoryPageInner(clubId, categoryId),
      PAGE_LOADER_TIMEOUT_MS,
      "loadFichaCategoryPage",
    );
  } catch (error) {
    console.error("[loadFichaCategoryPage]", error);
    return null;
  }
}

async function loadFichaCategoryPageInner(clubId: string, categoryId: string) {
  return withIntranetReadTx(async (tx) => {
    const [club, category, listaJugadores] = await Promise.all([
      clubRepository.findFichaClub(clubId, tx),
      categoryRepository.findFichaStaffByIdAndClub(categoryId, clubId, tx),
      playerRepository.findForFichaByCategory(clubId, categoryId, tx),
    ]);

    if (!club) return null;
    if (!category) return { club, category: null, listaJugadores: [] };

    return { club, category, listaJugadores };
  });
}

export async function loadNewPlayerPage(clubId: string, categoryId: string) {
  return withIntranetReadTx(async (tx) => {
    const club = await clubRepository.findNameById(clubId, tx);
    if (!club) return null;
    const category = await categoryRepository.findNameByIdAndClub(categoryId, clubId, tx);
    if (!category) return { club, category: null };
    return { club, category };
  });
}

export async function loadCarnetPage(
  clubId: string,
  categoryId: string,
  playerId: string,
) {
  return withIntranetReadTx(async (tx) => {
    const club = await clubRepository.findCarnetClub(clubId, tx);
    if (!club) return null;

    const category = await categoryRepository.findNameByIdAndClub(categoryId, clubId, tx);
    if (!category) return { club, category: null, jugador: null };

    const jugador = await playerRepository.findForCarnet(playerId, clubId, categoryId, tx);
    return { club, category, jugador };
  });
}
