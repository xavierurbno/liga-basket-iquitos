import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db/client";
import { clubRepository } from "@/repositories/clubRepository";
import { ActionResult } from "@/lib/types/league";
import { createServerClient } from "@supabase/ssr";
import type { Club, IdentityDocumentType } from "@/lib/db/schema";

function slugFromClubName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return (base || `club-${Date.now().toString(36)}`).slice(0, 45);
}

export type CreateClubServiceOptions = {
  /**
   * Obligatorio para clubes creados por LEAGUE_ADMIN (server action debe pasar `context.leagueId`).
   * SUPER_ADMIN: omitir o null según negocio.
   */
  leagueId?: string | null;
};

export async function createClubService(
  formData: FormData,
  user: { id: string; email: string },
  supabase: ReturnType<typeof createServerClient>,
  opts?: CreateClubServiceOptions
): Promise<ActionResult> {
  const asText = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
  const asDateOrNull = (v: FormDataEntryValue | null) => {
    if (typeof v !== "string" || !v.trim()) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  async function uploadImage(bucket: string, prefix: string, fieldName: string) {
    const field = formData.get(fieldName);
    if (!(field instanceof File) || field.size <= 0) return null;

    const ext = field.name.split(".").pop() || "jpg";
    const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(key, field, {
      contentType: field.type || "image/jpeg",
      upsert: true,
    });

    if (error) throw new Error(`Error subiendo ${fieldName}: ${error.message}`);

    const { data } = supabase.storage.from(bucket).getPublicUrl(key);
    return data.publicUrl;
  }

  try {
    const name =
      asText(formData.get("nombre_club")) ||
      asText(formData.get("name"));
    if (!name) {
      return { success: false, error: "El nombre del club es obligatorio." };
    }

    let slugBase = asText(formData.get("slug")) || slugFromClubName(name);
    slugBase = slugBase.slice(0, 50);

    let slug = slugBase;
    let sufijo = 0;
    while (sufijo < 200 && (await clubRepository.existsBySlug(slug))) {
      sufijo += 1;
      slug = `${slugBase}-${sufijo}`.slice(0, 50);
    }
    if (sufijo >= 200) {
      return {
        success: false,
        error: "No se pudo generar un slug único para el club. Prueba con otro nombre.",
      };
    }

    const [
      logoUrl,
      presidentPhoto,
      secretaryPhoto,
      treasurerPhoto,
    ] = await Promise.all([
      uploadImage(process.env.NEXT_PUBLIC_BUCKET_ASSETS!, "logos", "logoFile"),
      uploadImage(process.env.NEXT_PUBLIC_BUCKET_ASSETS!, "directivos", "presidentPhotoFile"),
      uploadImage(process.env.NEXT_PUBLIC_BUCKET_ASSETS!, "directivos", "secretaryPhotoFile"),
      uploadImage(process.env.NEXT_PUBLIC_BUCKET_ASSETS!, "directivos", "treasurerPhotoFile"),
    ]);

    const created = await db.transaction(async (tx) => {
      const club = await clubRepository.create(
        {
          leagueId: opts?.leagueId ?? null,
          name: name.slice(0, 100),
          slug: slug.slice(0, 50),
          courtAddress: asText(formData.get("direccion_cancha")) || null,
          adminPhone: asText(formData.get("telefono_admin")) || null,
          foundationDate: asDateOrNull(formData.get("fecha_fundacion")),
          logoUrl,
          adminEmail: user.email,
          presidentName: asText(formData.get("nombre_presidente")) || null,
          presidentLastname: asText(formData.get("apellido_presidente")) || null,
          presidentDocumentType:
            (formData.get("document_type_presidente") as IdentityDocumentType) || "DNI",
          presidentDocumentNumber: asText(formData.get("dni_presidente")) || null,
          presidentBirthdate: asDateOrNull(formData.get("fecha_nacimiento_presidente")),
          presidentContact: asText(formData.get("contacto_presidente")) || null,
          presidentEmail: asText(formData.get("correo_presidente")) || null,
          presidentPhotoUrl: presidentPhoto,

          secretaryName: asText(formData.get("nombre_secretario")) || null,
          secretaryLastname: asText(formData.get("apellido_secretario")) || null,
          secretaryDocumentType:
            (formData.get("document_type_secretario") as IdentityDocumentType) || "DNI",
          secretaryDocumentNumber: asText(formData.get("dni_secretario")) || null,
          secretaryBirthdate: asDateOrNull(formData.get("fecha_nacimiento_secretario")),
          secretaryContact: asText(formData.get("contacto_secretario")) || null,
          secretaryEmail: asText(formData.get("correo_secretario")) || null,
          secretaryPhotoUrl: secretaryPhoto,

          treasurerName: asText(formData.get("nombre_tesorero")) || null,
          treasurerLastname: asText(formData.get("apellido_tesorero")) || null,
          treasurerDocumentType:
            (formData.get("document_type_tesorero") as IdentityDocumentType) || "DNI",
          treasurerDocumentNumber: asText(formData.get("dni_tesorero")) || null,
          treasurerBirthdate: asDateOrNull(formData.get("fecha_nacimiento_tesorero")),
          treasurerContact: asText(formData.get("contacto_tesorero")) || null,
          treasurerEmail: asText(formData.get("correo_tesorero")) || null,
          treasurerPhotoUrl: treasurerPhoto,
        },
        tx,
      );

      if (!club) throw new Error("No se pudo crear el club.");

      return { id: club.id, slug: club.slug };
    });

    if (!created?.id || !created?.slug) {
      return { success: false, error: "No se obtuvo el club creado." };
    }

    revalidatePath("/liga/clubs/");
    revalidatePath(`/${created.slug}/`);
    return {
      success: true,
      clubId: created.id,
      clubSlug: created.slug,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}

/**
 * Actualiza un club existente con el mismo mapeo de FormData que la creación.
 * Conserva el slug y las URLs de fotos si no se suben archivos nuevos.
 */
export async function updateClubService(
  formData: FormData,
  clubId: string,
  supabase: ReturnType<typeof createServerClient>,
  existing: Club
): Promise<ActionResult> {
  const asText = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
  const asDateOrNull = (v: FormDataEntryValue | null) => {
    if (typeof v !== "string" || !v.trim()) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  async function uploadOrKeep(
    bucket: string,
    prefix: string,
    fieldName: string,
    previousUrl: string | null
  ): Promise<string | null> {
    const field = formData.get(fieldName);
    if (!(field instanceof File) || field.size <= 0) return previousUrl;

    const ext = field.name.split(".").pop() || "jpg";
    const key = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(key, field, {
      contentType: field.type || "image/jpeg",
      upsert: true,
    });

    if (error) throw new Error(`Error subiendo ${fieldName}: ${error.message}`);

    const { data } = supabase.storage.from(bucket).getPublicUrl(key);
    return data.publicUrl;
  }

  try {
    const name =
      asText(formData.get("nombre_club")) ||
      asText(formData.get("name")) ||
      existing.name;
    if (!name) {
      return { success: false, error: "El nombre del club es obligatorio." };
    }

    const bucket = process.env.NEXT_PUBLIC_BUCKET_ASSETS!;

    const [logoUrl, presidentPhotoUrl, secretaryPhotoUrl, treasurerPhotoUrl] =
      await Promise.all([
        uploadOrKeep(bucket, "logos", "logoFile", existing.logoUrl),
        uploadOrKeep(bucket, "directivos", "presidentPhotoFile", existing.presidentPhotoUrl),
        uploadOrKeep(bucket, "directivos", "secretaryPhotoFile", existing.secretaryPhotoUrl),
        uploadOrKeep(bucket, "directivos", "treasurerPhotoFile", existing.treasurerPhotoUrl),
      ]);

    await clubRepository.update(clubId, {
      name: name.slice(0, 100),
      courtAddress: (() => {
        const v = asText(formData.get("direccion_cancha"));
        return v || null;
      })(),
      adminPhone: (() => {
        const v = asText(formData.get("telefono_admin"));
        return v ? v.slice(0, 15) : null;
      })(),
      foundationDate: asDateOrNull(formData.get("fecha_fundacion")),
      logoUrl,
      presidentName: asText(formData.get("nombre_presidente")) || null,
      presidentLastname: asText(formData.get("apellido_presidente")) || null,
      presidentDocumentType:
        (formData.get("document_type_presidente") as IdentityDocumentType) || "DNI",
      presidentDocumentNumber: asText(formData.get("dni_presidente")) || null,
      presidentBirthdate: asDateOrNull(formData.get("fecha_nacimiento_presidente")),
      presidentContact: asText(formData.get("contacto_presidente")) || null,
      presidentEmail: asText(formData.get("correo_presidente")) || null,
      presidentPhotoUrl,

      secretaryName: asText(formData.get("nombre_secretario")) || null,
      secretaryLastname: asText(formData.get("apellido_secretario")) || null,
      secretaryDocumentType:
        (formData.get("document_type_secretario") as IdentityDocumentType) || "DNI",
      secretaryDocumentNumber: asText(formData.get("dni_secretario")) || null,
      secretaryBirthdate: asDateOrNull(formData.get("fecha_nacimiento_secretario")),
      secretaryContact: asText(formData.get("contacto_secretario")) || null,
      secretaryEmail: asText(formData.get("correo_secretario")) || null,
      secretaryPhotoUrl,

      treasurerName: asText(formData.get("nombre_tesorero")) || null,
      treasurerLastname: asText(formData.get("apellido_tesorero")) || null,
      treasurerDocumentType:
        (formData.get("document_type_tesorero") as IdentityDocumentType) || "DNI",
      treasurerDocumentNumber: asText(formData.get("dni_tesorero")) || null,
      treasurerBirthdate: asDateOrNull(formData.get("fecha_nacimiento_tesorero")),
      treasurerContact: asText(formData.get("contacto_tesorero")) || null,
      treasurerEmail: asText(formData.get("correo_tesorero")) || null,
      treasurerPhotoUrl,
    });

    revalidateTag("clubs-list", "max");
    revalidatePath("/liga/clubs/", "page" as any);
    revalidatePath(`/${existing.slug}/`);
    return {
      success: true,
      clubId,
      clubSlug: existing.slug,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { success: false, error: message };
  }
}
