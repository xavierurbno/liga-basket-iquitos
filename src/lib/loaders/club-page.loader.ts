import { clubRepository } from "@/repositories/clubRepository";
import { categoryRepository } from "@/repositories/categoryRepository";

export async function loadClubTenant(clubId: string) {
  return clubRepository.findTenantById(clubId);
}

export async function loadClubGalleryHeader(clubId: string) {
  return clubRepository.findGalleryHeaderById(clubId);
}

export async function loadClubCategoriesPage(clubId: string) {
  const club = await clubRepository.findTenantById(clubId);
  if (!club) return null;
  const categorias = await categoryRepository.findAllByClub(clubId);
  return { club, categorias };
}

export async function loadDelegateOnboardingClub(ownerId: string) {
  return clubRepository.findByOwnerId(ownerId);
}

/** `null` si el club no existe. */
export async function loadClubForGalleryRedirect(clubId: string) {
  return clubRepository.findPublicGalleryMetaById(clubId);
}

export async function loadPublicClubGalleryMeta(clubId: string) {
  return clubRepository.findPublicGalleryMetaById(clubId);
}
