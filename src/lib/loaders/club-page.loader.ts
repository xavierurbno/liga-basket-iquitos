import { unauthenticatedReadDb } from "@/lib/db/operational-db-access";
import { clubRepository } from "@/repositories/clubRepository";
import { categoryRepository } from "@/repositories/categoryRepository";

const publicDb = () => unauthenticatedReadDb();

export async function loadClubTenant(clubId: string) {
  return clubRepository.findTenantById(clubId, publicDb());
}

export async function loadClubGalleryHeader(clubId: string) {
  return clubRepository.findGalleryHeaderById(clubId, publicDb());
}

export async function loadClubCategoriesPage(clubId: string) {
  const db = publicDb();
  const club = await clubRepository.findTenantById(clubId, db);
  if (!club) return null;
  const categorias = await categoryRepository.findAllByClub(clubId, db);
  return { club, categorias };
}

export async function loadDelegateOnboardingClub(ownerId: string) {
  return clubRepository.findByOwnerId(ownerId);
}

/** `null` si el club no existe. */
export async function loadClubForGalleryRedirect(clubId: string) {
  return clubRepository.findPublicGalleryMetaById(clubId, publicDb());
}

export async function loadPublicClubGalleryMeta(clubId: string) {
  return clubRepository.findPublicGalleryMetaById(clubId, publicDb());
}
