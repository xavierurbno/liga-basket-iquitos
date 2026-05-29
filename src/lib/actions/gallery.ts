"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { db, galleryPhotos } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { ActionResult } from "@/lib/types/league";
import { applyWatermark } from "@/lib/watermark";
import { GALLERY_SERVER_PROCESS_CHUNK, mapInChunks } from "@/lib/gallery/server-upload";
import { resolveLeagueIdForGalleryUpload } from "@/lib/gallery/resolve-gallery-league-id";
import {
  buildGalleryStoragePath,
  validateGalleryUploadFile,
} from "@/lib/storage/storage-upload-guards";
import { clubBelongsToOperationalLeague } from "@/lib/auth/operational-league-scope";
import crypto from "crypto";

import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { User } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

/**
 * uploadPhotosAction
 * Solo SuperAdmins pueden subir fotos generales o asignar a clubs.
 */
export const uploadPhotosAction = withAuth(
  async (formData: FormData, user: User, context: AuthContext): Promise<ActionResult> => {
    try {
      const files = formData.getAll("files") as File[];
      const caption = (formData.get("caption") as string | null)?.trim() || null;
      const clubIdRaw = (formData.get("clubId") as string | null)?.trim();
      
      // Validar si es un UUID real para evitar errores de tipo en Postgres
      const isUuid = clubIdRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubIdRaw);
      const clubId = isUuid ? clubIdRaw : null;

      if (!files || files.length === 0) {
        return { success: false, error: "No hay archivos seleccionados." };
      }

      const leagueId = await resolveLeagueIdForGalleryUpload({
        clubId,
        operationalLeagueId: context.leagueId,
      });

      const adminSupabase = getAdminClient();
      const bucket = process.env.NEXT_PUBLIC_BUCKET_GALLERY!;

      const uploadResults = await mapInChunks(files, GALLERY_SERVER_PROCESS_CHUNK, async (file) => {
        const validationError = validateGalleryUploadFile(file);
        if (validationError) throw new Error(validationError);

        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);
        const processedBuffer = await applyWatermark(inputBuffer, { leagueId });

        const fileId = crypto.randomUUID();
        const filePath = buildGalleryStoragePath(`${fileId}.jpg`);

        const { error: uploadError } = await adminSupabase.storage
          .from(bucket)
          .upload(filePath, processedBuffer, {
            contentType: "image/jpeg",
            upsert: true,
            cacheControl: "3600",
          });

        if (uploadError) {
          throw new Error(`Error Supabase: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = adminSupabase.storage.from(bucket).getPublicUrl(filePath);

        return {
          url: publicUrl,
          caption,
          clubId,
          leagueId,
          registeredBy: user.id,
        };
      });

      const validRows = uploadResults.filter((r): r is NonNullable<typeof r> => r !== null);

      if (validRows.length > 0) {
        await db.insert(galleryPhotos).values(validRows);
      }

      revalidatePath("/liga/");
      revalidatePath("/liga/galeria-general");
      const { revalidateLeaguePortalByLeagueId } = await import("@/lib/portal/revalidate-league-portal");
      await revalidateLeaguePortalByLeagueId(validRows[0]?.leagueId ?? leagueId);
      return { success: true };
    } catch (err: any) {
      console.error("Upload Error:", err);
      return { success: false, error: err.message || "Error en la subida." };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"]
);

/**
 * deletePhotoAction
 * SuperAdmin puede borrar todo. Delegados solo fotos de su propio club (verificado por app_metadata).
 */
export const deletePhotoAction = withAuth(
  async (photoId: string, user: User, context: AuthContext): Promise<ActionResult> => {
    try {
      // 1. Obtener registro
      const [photo] = await db
        .select()
        .from(galleryPhotos)
        .where(eq(galleryPhotos.id, photoId))
        .limit(1);

      if (!photo) {
        return { success: false, error: "La foto no existe." };
      }

      // 2. Permisos por rol + liga operativa
      const isStaff = context.role === "SUPER_ADMIN" || context.role === "LEAGUE_ADMIN";
      const isClubOwner = context.clubId && photo.clubId === context.clubId;

      if (isStaff) {
        if (
          context.leagueId?.trim() &&
          photo.leagueId &&
          !clubBelongsToOperationalLeague(photo.leagueId, context.leagueId, context.role)
        ) {
          return {
            success: false,
            error: "No puedes eliminar fotos de otra liga.",
          };
        }
      } else if (!isClubOwner) {
        return { success: false, error: "No tienes permisos para eliminar esta foto." };
      }

      // 3. Extraer path del storage
      const fileName = photo.url.split("/").pop();
      const storagePath = `gallery/${fileName}`;

      const adminSupabase = getAdminClient();
      const bucket = process.env.NEXT_PUBLIC_BUCKET_GALLERY!;

      // 4. ELIMINACIÓN ATÓMICA: Primero Storage
      const { error: storageError } = await adminSupabase.storage
        .from(bucket)
        .remove([storagePath]);

      if (storageError) {
        console.error("Storage Delete Error:", storageError.message);
        return { success: false, error: "Error al eliminar el archivo físico." };
      }

      // 5. Segundo: Base de Datos
      await db.delete(galleryPhotos).where(eq(galleryPhotos.id, photoId));

      revalidatePath("/liga/");
      revalidatePath("/liga/galeria-general");
      const { revalidateLeaguePortalByLeagueId } = await import("@/lib/portal/revalidate-league-portal");
      await revalidateLeaguePortalByLeagueId(photo.leagueId ?? undefined, photo.clubId ?? undefined);
      return { success: true };
    } catch (err: any) {
      console.error("Delete Action Error:", err);
      return { success: false, error: "Error crítico en el proceso de eliminación." };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"]
);
