import { revalidatePath, revalidateTag } from "next/cache";
import { createSupabaseServerFromCookies } from "@/lib/supabase/server";
import { z } from "zod";
import { clubRepository } from "@/repositories/clubRepository";
import { busqueda365CategoriesCacheTag } from "@/lib/busqueda365/busqueda365-cache";
import { clubBelongsToOperationalLeague } from "@/lib/auth/operational-league-scope";
import type { AuthContext } from "@/lib/auth/withAuth";

export async function revalidateBusqueda365CategoriesForClub(
  clubId: string,
  context: AuthContext,
): Promise<void> {
  let leagueId = context.leagueId?.trim() || null;
  if (!leagueId) {
    const club = await clubRepository.findById(clubId);
    leagueId = club?.leagueId ?? null;
  }
  if (leagueId) {
    revalidateTag(busqueda365CategoriesCacheTag(leagueId), "max");
  }
}

export function slugifyNombre(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 45);
}

export async function uploadImageIfPresent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerFromCookies>>,
  bucket: string,
  pathPrefix: string,
  field: FormDataEntryValue | null,
) {
  if (!(field instanceof File) || field.size <= 0) return null;
  const ext = field.name.split(".").pop() || "jpg";
  const key = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(key, field, {
    contentType: field.type || "image/jpeg",
    upsert: true,
  });

  if (error) throw new Error(`No se pudo subir imagen: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  return data.publicUrl;
}

export function asDateOrNull(v: FormDataEntryValue | string | null | undefined) {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function asText(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

export function pickFormText(formData: FormData, ...keys: string[]): string {
  for (const key of keys) {
    const v = asText(formData.get(key));
    if (v) return v;
  }
  return "";
}

export async function resolveLeagueAndClubForPlayerAction(
  formData: FormData,
  context: AuthContext,
): Promise<{ leagueId: string; clubId: string } | { error: string }> {
  const clubId = context.clubId || asText(formData.get("clubId"));
  if (!clubId) {
    return { error: "Contexto de club no encontrado." };
  }

  const club = await clubRepository.findById(clubId);
  if (!club?.leagueId) {
    return { error: "Club no encontrado." };
  }

  if (!clubBelongsToOperationalLeague(club.leagueId, context.leagueId, context.role)) {
    return {
      error:
        context.role === "SUPER_ADMIN"
          ? "Este club no pertenece a la liga activa. Elige la liga correcta en el panel."
          : "No puedes registrar deportistas en este club.",
    };
  }

  if (context.role === "CLUB_DELEGATE" && context.clubId && clubId !== context.clubId) {
    return { error: "Acceso denegado: club no autorizado." };
  }

  const leagueId = context.leagueId?.trim() || club.leagueId;
  return { leagueId, clubId };
}

/** Valida que el club pertenece a la liga operativa y al delegado autenticado. */
export async function assertClubInOperationalScope(
  context: AuthContext,
  clubId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const club = await clubRepository.findById(clubId);
  if (!club?.leagueId) {
    return { ok: false, error: "Club no encontrado." };
  }

  if (!clubBelongsToOperationalLeague(club.leagueId, context.leagueId, context.role)) {
    return {
      ok: false,
      error:
        context.role === "SUPER_ADMIN"
          ? "Este club no pertenece a la liga activa. Elige la liga correcta en el panel."
          : "No puedes operar sobre este club.",
    };
  }

  if (context.role === "CLUB_DELEGATE" && context.clubId && clubId !== context.clubId) {
    return { ok: false, error: "Acceso denegado: club no autorizado." };
  }

  return { ok: true };
}

export function buildRegistroJugadorRawData(formData: FormData) {
  const jerseyRaw = pickFormText(formData, "jerseyNumber", "numeroPolo");
  return {
    name: pickFormText(formData, "name", "nombres"),
    lastname: pickFormText(formData, "lastname", "apellidos"),
    documentType: (pickFormText(formData, "documentType", "document_type") || "DNI") as
      | "DNI"
      | "CE"
      | "PASAPORTE",
    documentNumber: pickFormText(formData, "documentNumber", "document_number"),
    birthdate: pickFormText(formData, "birthdate", "fecha_nacimiento"),
    gender: (pickFormText(formData, "gender", "genero") || "MIXTO") as
      | "MASCULINO"
      | "FEMENINO"
      | "MIXTO",
    phone: pickFormText(formData, "phone", "telefono").replace(/\D/g, ""),
    address: pickFormText(formData, "address", "direccion"),
    position: pickFormText(formData, "position"),
    jerseyNumber: jerseyRaw ? Number(jerseyRaw) : undefined,
    tutorName: pickFormText(formData, "tutorName"),
    tutorDocumentType: (pickFormText(formData, "tutorDocumentType") || "DNI") as
      | "DNI"
      | "CE"
      | "PASAPORTE",
    tutorDocumentNumber: pickFormText(formData, "tutorDocumentNumber"),
    tutorPhone: pickFormText(formData, "tutorPhone").replace(/\D/g, ""),
    email: pickFormText(formData, "email") || "",
    emergencyContact: "",
  };
}

export function formatActionError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.toLowerCase().includes("bucket not found")) {
    return (
      "No se pudo subir la imagen porque falta un bucket en Supabase Storage. " +
      `Crea los buckets \`${process.env.NEXT_PUBLIC_BUCKET_ASSETS}\` y \`${process.env.NEXT_PUBLIC_BUCKET_PLAYERS}\` (públicos o con política de lectura) ` +
      "y vuelve a intentar."
    );
  }
  return msg || "Ocurrió un error inesperado al procesar la solicitud.";
}

export const crearCategoriaSchema = z.object({
  clubId: z.string().trim().min(1, "clubId requerido"),
  name: z.string().trim().min(1, "name requerido"),
  description: z.string().trim().optional().nullable(),
  entrenador: z
    .object({
      name: z.string().trim().optional().nullable(),
      lastname: z.string().trim().optional().nullable(),
      documentType: z.enum(["DNI", "CE", "PASAPORTE"]).optional().default("DNI"),
      documentNumber: z.string().trim().optional().nullable(),
      birthdate: z.string().trim().optional().nullable(),
      contacto: z.string().trim().optional().nullable(),
      correo: z.string().trim().optional().nullable(),
    })
    .optional()
    .nullable(),
  delegado: z
    .object({
      name: z.string().trim().optional().nullable(),
      lastname: z.string().trim().optional().nullable(),
      documentType: z.enum(["DNI", "CE", "PASAPORTE"]).optional().default("DNI"),
      documentNumber: z.string().trim().optional().nullable(),
      birthdate: z.string().trim().optional().nullable(),
      contacto: z.string().trim().optional().nullable(),
      correo: z.string().trim().optional().nullable(),
    })
    .optional()
    .nullable(),
});
