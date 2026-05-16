import { photoRepository } from "@/repositories/photoRepository";
export type { ClubWithPhotos } from "@/repositories/photoRepository";

export interface GalleryImage {
  id?: string;
  url: string;
  name: string;
  caption?: string;
}

export async function getLatestActionPhotos(leagueId?: string): Promise<GalleryImage[]> {
  try {
    const photos = await photoRepository.getLatest(16, leagueId);
    
    return photos.map((p) => ({
      id: p.id,
      url: p.url,
      name: p.id,
      caption: p.caption || "LDDBI en Acción",
    }));
  } catch (err) {
    console.error("Gallery Service Error:", err);
    return [];
  }
}

/**
 * Selecciona N fotos al azar de cualquier club para el carrusel principal.
 * Filtrado opcional por liga.
 */
export async function getRandomCarouselPhotos(count = 5, leagueId?: string): Promise<GalleryImage[]> {
  try {
    const photos = await photoRepository.getRandomForCarousel(count, leagueId);
    return photos.map((p) => ({
      id: p.id,
      url: p.url,
      name: p.id,
      caption: p.caption ?? undefined,
    }));
  } catch (err) {
    console.error("Random Carousel Error:", err);
    return [];
  }
}

/**
 * Retorna todos los clubes que tienen al menos 1 foto,
 * con sus últimas `photosPerClub` imágenes.
 */
export async function getClubsWithPhotos(photosPerClub = 4, leagueId?: string) {
  try {
    return await photoRepository.getClubsWithPhotos(photosPerClub, leagueId);
  } catch (err) {
    console.error("ClubsWithPhotos Error:", err);
    return [];
  }
}

/**
 * Fotos generales de la liga (club_id IS NULL) para la sección "GALERÍA LDDBI".
 */
export async function getGeneralPhotos(limit = 24, leagueId?: string): Promise<GalleryImage[]> {
  try {
    const photos = await photoRepository.getGeneral(1, limit, leagueId);
    return photos.map((p) => ({
      id: p.id,
      url: p.url,
      name: p.id,
      caption: p.caption ?? undefined,
    }));
  } catch (err) {
    console.error("General Photos Error:", err);
    return [];
  }
}
