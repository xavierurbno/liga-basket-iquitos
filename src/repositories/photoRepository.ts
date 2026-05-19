import { db } from "@/lib/db/client";
import { clubs, galleryPhotos, NewGalleryPhoto } from "@/lib/db/schema";
import { count, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

/** Foto individual del repositorio */
export type RepoPhoto = typeof galleryPhotos.$inferSelect;

/** Club con su lista de fotos (últimas N) + conteo total */
export interface ClubWithPhotos {
  clubId: string;
  clubName: string;
  clubSlug: string;
  logoUrl: string | null;
  colorPrimary: string | null;
  photos: RepoPhoto[];
  totalPhotos: number;
}

export const photoRepository = {
  async create(data: NewGalleryPhoto) {
    return db.insert(galleryPhotos).values(data).returning();
  },

  async getLatest(limit = 12, leagueId?: string) {
    const filters = leagueId ? eq(galleryPhotos.leagueId, leagueId) : undefined;
    return db
      .select()
      .from(galleryPhotos)
      .where(filters)
      .orderBy(desc(galleryPhotos.createdAt))
      .limit(limit);
  },

  /** Últimas N fotos de un club específico con paginación */
  async getByClub(clubId: string, page = 1, limit = 30): Promise<RepoPhoto[]> {
    const offset = (page - 1) * limit;
    return db
      .select()
      .from(galleryPhotos)
      .where(eq(galleryPhotos.clubId, clubId))
      .orderBy(desc(galleryPhotos.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async countByClub(clubId: string): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(galleryPhotos)
      .where(eq(galleryPhotos.clubId, clubId));
    return row?.total ?? 0;
  },

  /**
   * Retorna todos los clubes que tienen al menos 1 foto,
   * incluyendo sus últimas `photosPerClub` fotos.
   * Optimizado para evitar N+1.
   */
  async getClubsWithPhotos(photosPerClub = 1, leagueId?: string): Promise<ClubWithPhotos[]> {
    const filters = leagueId 
      ? sql`${galleryPhotos.clubId} IS NOT NULL AND ${galleryPhotos.leagueId} = ${leagueId}`
      : isNotNull(galleryPhotos.clubId);

    // 1. Obtener todos los clubes que tienen fotos y su conteo en una sola consulta
    const stats = await db
      .select({
        clubId: galleryPhotos.clubId,
        total: count(),
      })
      .from(galleryPhotos)
      .where(filters)
      .groupBy(galleryPhotos.clubId);

    if (stats.length === 0) return [];

    const clubIds = stats.map(s => s.clubId as string);

    // 2. Obtener la info de los clubes en una sola consulta
    const clubRows = await db
      .select()
      .from(clubs)
      .where(inArray(clubs.id, clubIds));

    const clubMap = new Map(clubRows.map(c => [c.id, c]));

    // 3. Obtener las portadas (última foto de cada club) en una sola consulta
    // Usamos distinctOn para obtener la foto más reciente por cada clubId
    // 3. Obtener fotos de los clubes involucrados
    // Las traemos todas de los clubes en stats, pero ordenadas para tomar la última en JS
    const allRecentPhotos = await db
      .select()
      .from(galleryPhotos)
      .where(inArray(galleryPhotos.clubId, clubIds))
      .orderBy(galleryPhotos.clubId, desc(galleryPhotos.createdAt));

    // Mapear las N más recientes por club
    const photosByClubMap = new Map<string, RepoPhoto[]>();
    for (const p of allRecentPhotos) {
      if (p.clubId) {
        const clubPhotos = photosByClubMap.get(p.clubId) || [];
        if (clubPhotos.length < photosPerClub) {
          clubPhotos.push(p);
          photosByClubMap.set(p.clubId, clubPhotos);
        }
      }
    }

    // 4. Armar el resultado final
    return stats.map((stat) => {
      const clubId = stat.clubId as string;
      const clubInfo = clubMap.get(clubId);
      const clubPhotos = photosByClubMap.get(clubId) || [];
      
      if (!clubInfo) return null;

      return {
        clubId: clubInfo.id,
        clubName: clubInfo.name,
        clubSlug: clubInfo.slug,
        logoUrl: clubInfo.logoUrl,
        colorPrimary: clubInfo.colorPrimary,
        photos: clubPhotos,
        totalPhotos: stat.total,
      } satisfies ClubWithPhotos;
    }).filter((r): r is ClubWithPhotos => r !== null);
  },

  /**
   * Fotos para el carrusel del portal: mezcla aleatoria de toda la liga (institucional + clubes).
   */
  async getRandomForCarousel(countLimit = 8, leagueId?: string): Promise<RepoPhoto[]> {
    const filters = leagueId ? eq(galleryPhotos.leagueId, leagueId) : undefined;
    return db
      .select()
      .from(galleryPhotos)
      .where(filters)
      .orderBy(sql`random()`)
      .limit(countLimit);
  },

  /** Fotos generales (sin club, club_id IS NULL) con paginación */
  async getGeneral(page = 1, limit = 30, leagueId?: string): Promise<RepoPhoto[]> {
    const offset = (page - 1) * limit;
    const filters = leagueId 
      ? sql`${galleryPhotos.clubId} IS NULL AND ${galleryPhotos.leagueId} = ${leagueId}`
      : sql`${galleryPhotos.clubId} IS NULL`;

    return db
      .select()
      .from(galleryPhotos)
      .where(filters)
      .orderBy(desc(galleryPhotos.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async countGeneral(leagueId?: string): Promise<number> {
    const filters = leagueId 
      ? sql`${galleryPhotos.clubId} IS NULL AND ${galleryPhotos.leagueId} = ${leagueId}`
      : sql`${galleryPhotos.clubId} IS NULL`;

    const [row] = await db
      .select({ total: count() })
      .from(galleryPhotos)
      .where(filters);
    return row?.total ?? 0;
  },

  async delete(id: string) {
    return db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
  },
};
