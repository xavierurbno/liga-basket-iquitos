"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { db, galleryPhotos } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { ActionResult } from "@/lib/types/league";
import { applyWatermark } from "@/lib/watermark";
import { GALLERY_SERVER_PROCESS_CHUNK, mapInChunks } from "@/lib/gallery/server-upload";
import crypto from "crypto";

import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { User } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con Service Role (bypass RLS)
 */
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

      const adminSupabase = getAdminClient();
      const bucket = process.env.NEXT_PUBLIC_BUCKET_GALLERY!;

      const uploadResults = await mapInChunks(files, GALLERY_SERVER_PROCESS_CHUNK, async (file) => {
        if (file.size === 0) return null;
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          throw new Error(`Tipo no permitido: ${file.type}`);
        }

        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);
        const processedBuffer = await applyWatermark(inputBuffer);

        const fileId = crypto.randomUUID();
        const filePath = `gallery/${fileId}.jpg`;

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
          registeredBy: user.id,
        };
      });

      const validRows = uploadResults.filter((r): r is NonNullable<typeof r> => r !== null);

      if (validRows.length > 0) {
        await db.insert(galleryPhotos).values(validRows);
      }

      revalidatePath("/liga/");
      revalidatePath("/", "page");
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

      // 2. Seguridad Robusta: Verificar permisos mediante app_metadata (context.clubId)
      // Evitamos confiar en user_metadata que es editable por el cliente.
      const isSuperAdmin = context.role === "SUPER_ADMIN" || context.role === "LEAGUE_ADMIN";
      const isClubOwner = context.clubId && photo.clubId === context.clubId;
      
      if (!isSuperAdmin && !isClubOwner) {
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
      revalidatePath("/", "page");
      return { success: true };
    } catch (err: any) {
      console.error("Delete Action Error:", err);
      return { success: false, error: "Error crítico en el proceso de eliminación." };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"]
);
