"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { clubRepository } from "@/repositories/clubRepository";
import { categoryRepository } from "@/repositories/categoryRepository";
import { playerRepository } from "@/repositories/playerRepository";
import { settingsRepository } from "@/repositories/settingsRepository";
import { assertTransferPeriodOpen } from "@/lib/transfer-period";
import { ActionResult, LeagueSettings } from "@/lib/types/league";
import { createClubService } from "@/services/clubService";
import { getCachedLeagueSettings } from "@/lib/data/cached-queries";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { isSuperAdminDataScope } from "@/lib/auth/intranet-roles";
import { User } from "@supabase/supabase-js";
import { db } from "@/lib/db/client";
import { treasury, clubMembers, playerStatusEnum, type PlayerStatus } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { movimientoCajaSchema, registroJugadorSchema } from "@/lib/validations/schemas";
import { generarNumeroFicha } from "@/lib/utils/category";

// --- Helpers ---

function slugifyNombre(name: string): string {
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

async function uploadImageIfPresent(
  supabase: ReturnType<typeof createServerClient>,
  bucket: string,
  pathPrefix: string,
  field: FormDataEntryValue | null
) {
  if (!(field instanceof File) || field.size <= 0) return null;
  try {
    const ext = field.name.split(".").pop() || "jpg";
    const key = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(key, field, {
      contentType: field.type || "image/jpeg",
      upsert: true,
    });

    if (error) throw new Error(`No se pudo subir imagen: ${error.message}`);

    const { data } = supabase.storage.from(bucket).getPublicUrl(key);
    return data.publicUrl;
  } catch (error) {
    throw error;
  }
}

function asDateOrNull(v: FormDataEntryValue | string | null | undefined) {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function asText(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

function formatActionError(error: unknown): string {
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

// --- Schemas ---

const crearCategoriaSchema = z.object({
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

// --- Actions ---

export const crearClubSistemaAction = withAuth(
  async (formData: FormData, user: User, context: AuthContext): Promise<ActionResult> => {
    if (context.role === "LEAGUE_ADMIN") {
      const lid = context.leagueId?.trim();
      if (!lid) {
        return {
          success: false,
          error: "Tu cuenta no tiene liga asignada; no puedes crear clubes.",
        };
      }
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll() {},
        },
      }
    );
    const res = await createClubService(
      formData,
      { id: user.id, email: user.email || "" },
      supabase,
      context.role === "LEAGUE_ADMIN"
        ? { leagueId: context.leagueId!.trim() }
        : undefined,
    );

    if (!res.success) {
      return res;
    }

    const clubId = res.clubId;
    const clubSlug = res.clubSlug;
    if (!clubId || !clubSlug) {
      return { success: false, error: "No se obtuvieron id ni slug del club creado." };
    }

    revalidateTag("clubs-list", "max");
    revalidatePath(`/${clubSlug}/`);
    return { success: true, clubId, clubSlug };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"]
);

export const crearCategoriaAction = withAuth(
  async (formData: FormData, _user: User, context: AuthContext): Promise<ActionResult> => {
    const { clubId } = context;
    const name = asText(formData.get("nombre_categoria"));
    const notes = asText(formData.get("descripcion"));

    if (!clubId || !name) {
      return { success: false, error: "El ID del club y el nombre de la categoría son requeridos." };
    }

    const parsed = crearCategoriaSchema.safeParse({
      clubId,
      name,
      description: notes || null,
      entrenador: {
        name: asText(formData.get("nombre_entrenador")) || null,
        lastname: asText(formData.get("apellido_entrenador")) || null,
        documentType: (formData.get("document_type_entrenador") as any) || "DNI",
        documentNumber: asText(formData.get("dni_entrenador")) || null,
        birthdate: asText(formData.get("fecha_nacimiento_entrenador")) || null,
        contacto: asText(formData.get("contacto_entrenador")) || null,
        correo: asText(formData.get("correo_entrenador")) || null,
      },
      delegado: {
        name: asText(formData.get("nombre_delegado")) || null,
        lastname: asText(formData.get("apellido_delegado")) || null,
        documentType: (formData.get("document_type_delegado") as any) || "DNI",
        documentNumber: asText(formData.get("dni_delegado")) || null,
        birthdate: asText(formData.get("fecha_nacimiento_delegado")) || null,
        contacto: asText(formData.get("contacto_delegado")) || null,
        correo: asText(formData.get("correo_delegado")) || null,
      },
    });

    if (!parsed.success) return { success: false, error: "Datos de categoría inválidos." };

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll() {},
        },
      }
    );

    const entrenadorFotoSubida = await uploadImageIfPresent(
      supabase,
      process.env.NEXT_PUBLIC_BUCKET_ASSETS!,
      `clubs/${clubId}/categories/${slugifyNombre(name)}/entrenador`,
      formData.get("entrenador_foto")
    );
    const delegadoFotoSubida = await uploadImageIfPresent(
      supabase,
      process.env.NEXT_PUBLIC_BUCKET_ASSETS!,
      `clubs/${clubId}/categories/${slugifyNombre(name)}/delegado`,
      formData.get("delegado_foto")
    );

    await categoryRepository.create({
      clubId,
      name,
      description: notes || null,
      coachName: parsed.data.entrenador?.name,
      coachLastname: parsed.data.entrenador?.lastname,
      coachDocumentType: parsed.data.entrenador?.documentType as any,
      coachDocumentNumber: parsed.data.entrenador?.documentNumber,
      coachBirthdate: asDateOrNull(parsed.data.entrenador?.birthdate),
      coachContact: parsed.data.entrenador?.contacto,
      coachEmail: parsed.data.entrenador?.correo,
      coachPhotoUrl: entrenadorFotoSubida,
      delegateName: parsed.data.delegado?.name,
      delegateLastname: parsed.data.delegado?.lastname,
      delegateDocumentType: parsed.data.delegado?.documentType as any,
      delegateDocumentNumber: parsed.data.delegado?.documentNumber,
      delegateBirthdate: asDateOrNull(parsed.data.delegado?.birthdate),
      delegateContact: parsed.data.delegado?.contacto,
      delegateEmail: parsed.data.delegado?.correo,
      delegatePhotoUrl: delegadoFotoSubida,
    });

    revalidateTag("categories-list", "max");
    revalidatePath(`/liga/clubs/${clubId}/`, "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"]
);

export const eliminarCategoriaAction = withAuth(
  async (formData: FormData, _user: User, context: AuthContext): Promise<ActionResult> => {
    const clubId = context.clubId || asText(formData.get("clubId"));
    const categoryId = asText(formData.get("categoryId"));

    if (!clubId || !categoryId) return { success: false, error: "Datos incompletos." };

    await categoryRepository.delete(categoryId);
    revalidateTag("categories-list", "max");
    revalidatePath(`/liga/clubs/${clubId}/`, "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"]
);

export const actualizarCategoriaAction = withAuth(
  async (formData: FormData, _user: User, context: AuthContext): Promise<ActionResult> => {
    const clubId = context.clubId || asText(formData.get("clubId"));
    const categoryId = asText(formData.get("categoryId"));
    const name = asText(formData.get("nombre_categoria"));
    const description = asText(formData.get("descripcion"));

    if (!clubId || !categoryId || !name) return { success: false, error: "Datos incompletos." };

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll() {},
        },
      }
    );

    const coachPhotoUrl = await uploadImageIfPresent(
      supabase,
      process.env.NEXT_PUBLIC_BUCKET_ASSETS!,
      `clubs/${clubId}/categories/${slugifyNombre(name)}/entrenador`,
      formData.get("entrenadorFotoFile")
    );
    const delegatePhotoUrl = await uploadImageIfPresent(
      supabase,
      process.env.NEXT_PUBLIC_BUCKET_ASSETS!,
      `clubs/${clubId}/categories/${slugifyNombre(name)}/delegado`,
      formData.get("delegadoFotoFile")
    );

    await categoryRepository.update(categoryId, {
      name,
      description: description || null,
      coachName: asText(formData.get("nombre_entrenador")) || null,
      coachLastname: asText(formData.get("apellido_entrenador")) || null,
      coachDocumentType: (formData.get("document_type_entrenador") as any) || "DNI",
      coachDocumentNumber: asText(formData.get("dni_entrenador")) || null,
      coachBirthdate: asDateOrNull(formData.get("fecha_nacimiento_entrenador")),
      coachContact: asText(formData.get("contacto_entrenador")) || null,
      coachEmail: asText(formData.get("correo_entrenador")) || null,
      coachPhotoUrl: coachPhotoUrl || asText(formData.get("entrenadorFotoActual")) || null,
      delegateName: asText(formData.get("nombre_delegado")) || null,
      delegateLastname: asText(formData.get("apellido_delegado")) || null,
      delegateDocumentType: (formData.get("document_type_delegado") as any) || "DNI",
      delegateDocumentNumber: asText(formData.get("dni_delegado")) || null,
      delegateBirthdate: asDateOrNull(formData.get("fecha_nacimiento_delegado")),
      delegateContact: asText(formData.get("contacto_delegado")) || null,
      delegateEmail: asText(formData.get("correo_delegado")) || null,
      delegatePhotoUrl: delegatePhotoUrl || asText(formData.get("delegadoFotoActual")) || null,
    });

    revalidateTag("categories-list", "max");
    revalidatePath(`/liga/clubs/${clubId}/`, "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"]
);

/**
 * registrarJugadorAction
 * Envuelto con withAuth para protección multi-tenant y RBAC.
 * Implementa transacciones atómicas (DB + Storage).
 */
export const registrarJugadorAction = withAuth(
  async (formData: FormData, _user: User, context: AuthContext): Promise<ActionResult> => {
    let uploadedPhotoKey: string | null = null;

    try {
      const { leagueId, clubId } = context;
      const categoryId = asText(formData.get("categoryId"));

      if (!leagueId || !clubId || !categoryId) {
        return { success: false, error: "Contexto de liga o club no encontrado." };
      }

      // Normalización de campos del FormData para que coincidan con el esquema
      const rawData = {
        name: asText(formData.get("name")),
        lastname: asText(formData.get("lastname")),
        documentType: (formData.get("documentType") as any) ?? "DNI",
        documentNumber: asText(formData.get("documentNumber")),
        birthdate: asText(formData.get("birthdate")),
        gender: (formData.get("gender") as any) ?? "MIXTO",
        phone: asText(formData.get("phone")),
        address: asText(formData.get("address")),
        position: asText(formData.get("position")),
        jerseyNumber: formData.get("jerseyNumber") ? Number(formData.get("jerseyNumber")) : undefined,
        tutorName: asText(formData.get("tutorName")),
        tutorDocumentType: (formData.get("tutorDocumentType") as any) ?? "DNI",
        tutorDocumentNumber: asText(formData.get("tutorDocumentNumber")),
        tutorPhone: asText(formData.get("tutorPhone")),
      };

      const validated = registroJugadorSchema.safeParse(rawData);
      if (!validated.success) {
        const errorMsg = validated.error.issues[0]?.message || "Datos de formulario inválidos.";
        return { success: false, error: errorMsg };
      }

      const { data } = validated;

      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => cookieStore.getAll(),
            setAll() {},
          },
        }
      );

      // 1. Pre-subida de Imagen (Fuera de la transacción de DB pero controlada)
      let photoUrl: string | null = null;
      const fotoArchivo = formData.get("foto");
      
      if (fotoArchivo instanceof File && fotoArchivo.size > 0) {
        const ext = fotoArchivo.name.split(".").pop() || "jpg";
        uploadedPhotoKey = `clubs/${clubId}/players/${data.documentNumber}-${Date.now()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from(process.env.NEXT_PUBLIC_BUCKET_PLAYERS!)
          .upload(uploadedPhotoKey, fotoArchivo, { upsert: true });

        if (uploadError) throw new Error(`Error al subir foto: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from(process.env.NEXT_PUBLIC_BUCKET_PLAYERS!)
          .getPublicUrl(uploadedPhotoKey);
        
        photoUrl = publicUrl;
      }

      // 2. Transacción de Base de Datos
      await db.transaction(async (tx) => {
        const catRow = await categoryRepository.findById(categoryId, tx);
        if (!catRow) throw new Error("Categoría no encontrada.");

        // V-03: Concurrency Fix mediante Secuencia de Postgres
        const seqResult = await tx.execute(sql`SELECT nextval('carnet_deportista_seq')`);
        const nextVal = Number(seqResult[0].nextval);
        const carnetNumber = generarNumeroFicha(catRow.name as any, nextVal);

        await playerRepository.create({
          leagueId, // Inyección automática
          clubId,   // Inyección automática
          categoryId,
          name: data.name,
          lastname: data.lastname,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          birthdate: data.birthdate,
          gender: data.gender,
          category: catRow.name as any,
          phone: data.phone || undefined,
          photoUrl,
          jerseyNumber: data.jerseyNumber,
          status: "ACTIVO",
          carnetNumber, // Número único garantizado por secuencia
          tutorName: data.tutorName || undefined,
          tutorDocumentType: data.tutorDocumentType || "DNI",
          tutorDocumentNumber: data.tutorDocumentNumber || undefined,
          tutorPhone: data.tutorPhone || undefined,
        }, tx);
      });

      revalidatePath(`/liga/clubs/${clubId}/categories/${categoryId}/`, "page" as any);
      return { success: true };

    } catch (error: any) {
      console.error("Error en registrarJugadorAction:", error);
      
      // V-02: Rollback de Storage si la DB falla
      if (uploadedPhotoKey) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { cookies: { getAll: () => cookieStore.getAll(), setAll() {} } }
        );
        await supabase.storage
          .from(process.env.NEXT_PUBLIC_BUCKET_PLAYERS!)
          .remove([uploadedPhotoKey]);
      }

      return { success: false, error: formatActionError(error) };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"]
);

export const eliminarClubAction = withAuth(
  async (formData: FormData, _user: User, context: AuthContext): Promise<ActionResult> => {
    const clubId = asText(formData.get("clubId"));
    if (!clubId) return { success: false, error: "clubId requerido." };

    const existing = await clubRepository.findById(clubId);
    if (!existing) {
      return { success: false, error: "Club no encontrado." };
    }

    if (context.role === "LEAGUE_ADMIN") {
      const actorLeague = context.leagueId?.trim();
      if (!actorLeague || existing.leagueId !== actorLeague) {
        return { success: false, error: "No puedes eliminar clubes fuera de tu liga." };
      }
    }

    await clubRepository.delete(clubId);
    revalidateTag("clubs-list", "max");
    revalidatePath("/liga/clubs/", "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"]
);

/** Para `<form action={…}>`: el tipo de Server Actions de formulario espera `Promise<void>`. */
export async function eliminarClubFormAction(formData: FormData): Promise<void> {
  await eliminarClubAction(formData);
}

export const editarDeportistaAction = withAuth(
  async (formData: FormData, _user: User, context: AuthContext): Promise<ActionResult> => {
    const clubId = context.clubId || asText(formData.get("clubId"));
    const categoryId = asText(formData.get("categoryId"));
    const playerId = asText(formData.get("playerId"));
    const documentType = (formData.get("document_type") as any) ?? "DNI";
    const documentNumber = asText(formData.get("document_number"));
    const lastname = asText(formData.get("apellidos"));
    const name = asText(formData.get("nombres"));
    const birthdate = asText(formData.get("fecha_nacimiento"));
    const telefono = asText(formData.get("telefono"));
    const direccion = asText(formData.get("direccion"));
    const genero = (formData.get("genero") as "MASCULINO" | "FEMENINO" | "MIXTO" | null) ?? "MIXTO";
    const status = (formData.get("status") as any) ?? undefined;
    const fotoActual = asText(formData.get("fotoActual"));

    if (!clubId || !categoryId || !playerId || !documentNumber || !lastname || !name || !birthdate) {
      return { success: false, error: "Campos obligatorios incompletos." };
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll() {},
        },
      }
    );

    const fotoSubida = await uploadImageIfPresent(
      supabase,
      process.env.NEXT_PUBLIC_BUCKET_PLAYERS!,
      `clubs/${clubId}/categories/${categoryId}/players`,
      formData.get("foto_archivo")
    );

    await playerRepository.update(playerId, clubId, {
      documentType,
      documentNumber,
      lastname: lastname.slice(0, 80),
      name: name.slice(0, 80),
      birthdate: new Date(birthdate),
      phone: telefono || null,
      address: direccion || null,
      gender: genero,
      status: status,
      photoUrl: fotoSubida || fotoActual || null,
      tutorName: asText(formData.get("tutorName")) || null,
      tutorDocumentType: (formData.get("tutor_document_type") as any) || "DNI",
      tutorDocumentNumber: asText(formData.get("tutor_document_number")) || null,
      tutorPhone: asText(formData.get("tutorPhone")) || null,
    }, db, {
      bypassClubFilter: isSuperAdminDataScope(context.role),
      actingRole: context.role,
    });

    revalidatePath(`/liga/clubs/${clubId}/categories/${categoryId}/`, "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"]
);

export const eliminarDeportistaAction = withAuth(
  async (formData: FormData, _user: User, context: AuthContext): Promise<ActionResult> => {
    const clubId = context.clubId || asText(formData.get("clubId"));
    const categoryId = asText(formData.get("categoryId"));
    const playerId = asText(formData.get("playerId"));

    if (!clubId || !categoryId || !playerId) {
      return { success: false, error: "Datos incompletos." };
    }

    await playerRepository.delete(playerId, clubId, db, {
      bypassClubFilter: isSuperAdminDataScope(context.role),
      actingRole: context.role,
    });

    revalidatePath(`/liga/clubs/${clubId}/categories/${categoryId}/`, "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"]
);

export const actualizarEstadoJugadorAction = withAuth(
  async (playerId: string, status: string, _user: User, context: AuthContext): Promise<ActionResult> => {
    const allowed = playerStatusEnum.enumValues as readonly string[];
    if (!allowed.includes(status)) {
      return { success: false, error: "Estado no válido." };
    }
    const player = await playerRepository.findById(playerId);
    if (!player) {
      return { success: false, error: "Jugador no encontrado." };
    }
    const bypass = isSuperAdminDataScope(context.role);
    if (!bypass) {
      if (context.role === "CLUB_DELEGATE") {
        if (!context.clubId || player.clubId !== context.clubId) {
          return { success: false, error: "No autorizado para este club." };
        }
      }
      if (context.role === "LEAGUE_ADMIN") {
        const club = await clubRepository.findById(player.clubId);
        if (!club?.leagueId || !context.leagueId || club.leagueId !== context.leagueId) {
          return { success: false, error: "No autorizado en esta liga." };
        }
      }
    }
    await playerRepository.updateStatus(
      playerId,
      status as PlayerStatus,
      db,
      bypass
        ? { bypassClubFilter: true, actingRole: context.role }
        : { actingRole: context.role, clubId: player.clubId }
    );
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"]
);

export async function getTransferStatusAction(): Promise<{
  isOpen: boolean;
  message: string;
  start?: Date | null;
  end?: Date | null;
  isManualOverride?: boolean;
}> {
  const status = await assertTransferPeriodOpen();
  const settings = await getCachedLeagueSettings();

  return {
    isOpen: status.success,
    message: status.error || "El periodo de transferencias está abierto.",
    start: settings?.transferPeriodStart,
    end: settings?.transferPeriodEnd,
    isManualOverride: settings?.isManualOverride ?? false,
  };
}

export const toggleTransferOverrideAction = withAuth(
  async (newState: boolean, _user: User, _context: AuthContext): Promise<ActionResult> => {
    await settingsRepository.toggleOverride(newState);
    revalidateTag("league-settings", "max");
    revalidatePath("/liga/", "page" as any);
    revalidatePath("/", "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"]
);

export async function getLeagueSettingsAction(): Promise<LeagueSettings> {
  try {
    const settings = await getCachedLeagueSettings();
    if (!settings) return {};
    return {
      id: settings.id,
      transferPeriodStart: settings.transferPeriodStart,
      transferPeriodEnd: settings.transferPeriodEnd,
      bannerText: settings.bannerText,
      isManualOverride: settings.isManualOverride ?? false,
    } as LeagueSettings;
  } catch {
    return {};
  }
}

export const updateLeagueSettingsAction = withAuth(
  async (data: LeagueSettings, _user: User, _context: AuthContext): Promise<ActionResult> => {
    const start = data.transferPeriodStart ? new Date(data.transferPeriodStart) : null;
    const end = data.transferPeriodEnd ? new Date(data.transferPeriodEnd) : null;

    if (start && isNaN(start.getTime())) return { success: false, error: "Fecha de inicio inválida." };
    if (end && isNaN(end.getTime())) return { success: false, error: "Fecha de cierre inválida." };
    if (start && end && start >= end) return { success: false, error: "La fecha de inicio debe ser anterior al cierre." };

    await settingsRepository.upsert({
      transferPeriodStart: start,
      transferPeriodEnd: end,
      bannerText: data.bannerText?.trim() || null,
      isManualOverride: data.isManualOverride ?? false,
    });

    revalidateTag("league-settings", "max");
    revalidatePath("/", "page" as any);
    revalidatePath("/login", "page" as any);
    revalidatePath("/liga/", "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"]
);

export async function seedLeagueSettingsAction(): Promise<ActionResult> {
  try {
    const existing = await settingsRepository.getSettings();
    if (existing) return { success: true };

    await settingsRepository.upsert({
      transferPeriodStart: null,
      transferPeriodEnd: null,
      bannerText: "El Mercado de Pases está cerrado temporalmente.",
      isManualOverride: false,
    });

    revalidateTag("league-settings", "max");
    return { success: true };
  } catch (error) {
    return { success: false, error: formatActionError(error) };
  }
}

/**
 * registrarMovimientoAction
 * Gestiona ingresos y egresos de caja para un club.
 * Protegido por tenant isolation en withAuth.
 */
export const registrarMovimientoAction = withAuth(
  async (formData: FormData, user: User, context: AuthContext): Promise<ActionResult> => {
    try {
      const clubId = context.clubId || asText(formData.get("clubId"));
      
      if (!clubId) {
        return { success: false, error: "Contexto de club no encontrado." };
      }

      const rawData = {
        type: formData.get("type"),
        amount: Number(formData.get("amount")),
        concept: formData.get("concept"),
        paymentChannel: formData.get("paymentChannel"),
        operationCode: formData.get("operationCode") || undefined,
        playerId: formData.get("playerId") || undefined,
        transactionDate: formData.get("transactionDate") || new Date().toISOString(),
        notes: formData.get("notes") || undefined,
      };

      const validated = movimientoCajaSchema.safeParse(rawData);
      if (!validated.success) {
        return { success: false, error: "Datos de formulario inválidos." };
      }

      const data = validated.data;
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll() {} } }
      );

      let proofUrl: string | null = null;
      const comprobante = formData.get("comprobante");

      if (comprobante instanceof File && comprobante.size > 0) {
        const ext = comprobante.name.split(".").pop() || "jpg";
        const storageKey = `clubs/${clubId}/receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(process.env.NEXT_PUBLIC_BUCKET_RECEIPTS!)
          .upload(storageKey, comprobante, { contentType: comprobante.type });

        if (uploadError) throw new Error(`Error al subir comprobante: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from(process.env.NEXT_PUBLIC_BUCKET_RECEIPTS!)
          .getPublicUrl(storageKey);

        proofUrl = urlData.publicUrl;
      }

      await db.insert(treasury).values({
        leagueId: context.leagueId,
        clubId,
        type: data.type,
        amount: String(data.amount),
        concept: data.concept,
        paymentChannel: data.paymentChannel,
        operationCode: data.operationCode,
        playerId: data.playerId,
        transactionDate: data.transactionDate,
        notes: data.notes,
        registeredBy: user.id,
        proofUrl,
      });

      revalidatePath(`/liga/clubs/${clubId}/caja/`, "page" as any);
      return { success: true };

    } catch (error: any) {
      console.error("Error en registrarMovimientoAction:", error);
      return { success: false, error: formatActionError(error) };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"]
);
