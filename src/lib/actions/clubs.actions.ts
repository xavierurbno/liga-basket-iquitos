"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createSupabaseServerFromCookies } from "@/lib/supabase/server";
import { clubRepository } from "@/repositories/clubRepository";
import { categoryRepository } from "@/repositories/categoryRepository";
import { ActionResult } from "@/lib/types/league";
import { createClubService } from "@/services/clubService";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { User } from "@supabase/supabase-js";
import { db } from "@/lib/db/client";
import { treasury } from "@/lib/db/schema";
import { movimientoCajaSchema } from "@/lib/validations/schemas";
import {
  asDateOrNull,
  asText,
  crearCategoriaSchema,
  formatActionError,
  revalidateBusqueda365CategoriesForClub,
  slugifyNombre,
  uploadImageIfPresent,
} from "@/lib/actions/system-dashboard-helpers";

export const createClubAsSystemAction = withAuth(
  async (formData: FormData, user: User, context: AuthContext): Promise<ActionResult> => {
    const operationalLeagueId = context.leagueId?.trim() || null;
    if (context.role === "LEAGUE_ADMIN" || context.role === "SUPER_ADMIN") {
      if (!operationalLeagueId) {
        return {
          success: false,
          error:
            context.role === "SUPER_ADMIN"
              ? "Selecciona una liga activa antes de crear clubes."
              : "Tu cuenta no tiene liga asignada; no puedes crear clubes.",
        };
      }
    }

    const supabase = await createSupabaseServerFromCookies();
    const res = await createClubService(
      formData,
      { id: user.id, email: user.email || "" },
      supabase,
      operationalLeagueId ? { leagueId: operationalLeagueId } : undefined,
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
    revalidatePath(`/liga/clubs/${clubId}/`);
    return { success: true, clubId, clubSlug };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"],
);

export const crearCategoriaAction = withAuth(
  async (formData: FormData, _user: User, context: AuthContext): Promise<ActionResult> => {
    const clubId = context.clubId || asText(formData.get("clubId"));
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
        documentType: (formData.get("document_type_entrenador") as "DNI" | "CE" | "PASAPORTE") || "DNI",
        documentNumber: asText(formData.get("dni_entrenador")) || null,
        birthdate: asText(formData.get("fecha_nacimiento_entrenador")) || null,
        contacto: asText(formData.get("contacto_entrenador")) || null,
        correo: asText(formData.get("correo_entrenador")) || null,
      },
      delegado: {
        name: asText(formData.get("nombre_delegado")) || null,
        lastname: asText(formData.get("apellido_delegado")) || null,
        documentType: (formData.get("document_type_delegado") as "DNI" | "CE" | "PASAPORTE") || "DNI",
        documentNumber: asText(formData.get("dni_delegado")) || null,
        birthdate: asText(formData.get("fecha_nacimiento_delegado")) || null,
        contacto: asText(formData.get("contacto_delegado")) || null,
        correo: asText(formData.get("correo_delegado")) || null,
      },
    });

    if (!parsed.success) return { success: false, error: "Datos de categoría inválidos." };

    const supabase = await createSupabaseServerFromCookies();

    const entrenadorFotoSubida = await uploadImageIfPresent(
      supabase,
      process.env.NEXT_PUBLIC_BUCKET_ASSETS!,
      `clubs/${clubId}/categories/${slugifyNombre(name)}/entrenador`,
      formData.get("entrenadorFotoFile"),
    );
    const delegadoFotoSubida = await uploadImageIfPresent(
      supabase,
      process.env.NEXT_PUBLIC_BUCKET_ASSETS!,
      `clubs/${clubId}/categories/${slugifyNombre(name)}/delegado`,
      formData.get("delegadoFotoFile"),
    );

    await categoryRepository.create({
      clubId,
      name,
      description: notes || null,
      coachName: parsed.data.entrenador?.name,
      coachLastname: parsed.data.entrenador?.lastname,
      coachDocumentType: parsed.data.entrenador?.documentType as "DNI" | "CE" | "PASAPORTE",
      coachDocumentNumber: parsed.data.entrenador?.documentNumber,
      coachBirthdate: asDateOrNull(parsed.data.entrenador?.birthdate),
      coachContact: parsed.data.entrenador?.contacto,
      coachEmail: parsed.data.entrenador?.correo,
      coachPhotoUrl: entrenadorFotoSubida,
      delegateName: parsed.data.delegado?.name,
      delegateLastname: parsed.data.delegado?.lastname,
      delegateDocumentType: parsed.data.delegado?.documentType as "DNI" | "CE" | "PASAPORTE",
      delegateDocumentNumber: parsed.data.delegado?.documentNumber,
      delegateBirthdate: asDateOrNull(parsed.data.delegado?.birthdate),
      delegateContact: parsed.data.delegado?.contacto,
      delegateEmail: parsed.data.delegado?.correo,
      delegatePhotoUrl: delegadoFotoSubida,
    });

    await revalidateBusqueda365CategoriesForClub(clubId, context);
    revalidatePath(`/liga/clubs/${clubId}/`, "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"],
);

export const eliminarCategoriaAction = withAuth(
  async (formData: FormData, _user: User, context: AuthContext): Promise<ActionResult> => {
    const clubId = context.clubId || asText(formData.get("clubId"));
    const categoryId = asText(formData.get("categoryId"));

    if (!clubId || !categoryId) return { success: false, error: "Datos incompletos." };

    await categoryRepository.delete(categoryId);
    await revalidateBusqueda365CategoriesForClub(clubId, context);
    revalidatePath(`/liga/clubs/${clubId}/`, "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"],
);

export async function eliminarCategoriaFormAction(formData: FormData): Promise<void> {
  await eliminarCategoriaAction(formData);
}

export const actualizarCategoriaAction = withAuth(
  async (formData: FormData, _user: User, context: AuthContext): Promise<ActionResult> => {
    const clubId = context.clubId || asText(formData.get("clubId"));
    const categoryId = asText(formData.get("categoryId"));
    const name = asText(formData.get("nombre_categoria"));
    const description = asText(formData.get("descripcion"));

    if (!clubId || !categoryId || !name) return { success: false, error: "Datos incompletos." };

    const supabase = await createSupabaseServerFromCookies();

    const coachPhotoUrl = await uploadImageIfPresent(
      supabase,
      process.env.NEXT_PUBLIC_BUCKET_ASSETS!,
      `clubs/${clubId}/categories/${slugifyNombre(name)}/entrenador`,
      formData.get("entrenadorFotoFile"),
    );
    const delegatePhotoUrl = await uploadImageIfPresent(
      supabase,
      process.env.NEXT_PUBLIC_BUCKET_ASSETS!,
      `clubs/${clubId}/categories/${slugifyNombre(name)}/delegado`,
      formData.get("delegadoFotoFile"),
    );

    await categoryRepository.update(categoryId, {
      name,
      description: description || null,
      coachName: asText(formData.get("nombre_entrenador")) || null,
      coachLastname: asText(formData.get("apellido_entrenador")) || null,
      coachDocumentType: (formData.get("document_type_entrenador") as "DNI" | "CE" | "PASAPORTE") || "DNI",
      coachDocumentNumber: asText(formData.get("dni_entrenador")) || null,
      coachBirthdate: asDateOrNull(formData.get("fecha_nacimiento_entrenador")),
      coachContact: asText(formData.get("contacto_entrenador")) || null,
      coachEmail: asText(formData.get("correo_entrenador")) || null,
      coachPhotoUrl: coachPhotoUrl || asText(formData.get("entrenadorFotoActual")) || null,
      delegateName: asText(formData.get("nombre_delegado")) || null,
      delegateLastname: asText(formData.get("apellido_delegado")) || null,
      delegateDocumentType: (formData.get("document_type_delegado") as "DNI" | "CE" | "PASAPORTE") || "DNI",
      delegateDocumentNumber: asText(formData.get("dni_delegado")) || null,
      delegateBirthdate: asDateOrNull(formData.get("fecha_nacimiento_delegado")),
      delegateContact: asText(formData.get("contacto_delegado")) || null,
      delegateEmail: asText(formData.get("correo_delegado")) || null,
      delegatePhotoUrl: delegatePhotoUrl || asText(formData.get("delegadoFotoActual")) || null,
    });

    await revalidateBusqueda365CategoriesForClub(clubId, context);
    revalidatePath(`/liga/clubs/${clubId}/`, "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"],
);

export const eliminarClubAction = withAuth(
  async (formData: FormData, _user: User, context: AuthContext): Promise<ActionResult> => {
    const clubId = asText(formData.get("clubId"));
    if (!clubId) return { success: false, error: "clubId requerido." };

    const existing = await clubRepository.findById(clubId);
    if (!existing) {
      return { success: false, error: "Club no encontrado." };
    }

    const actorLeague = context.leagueId?.trim();
    if (context.role === "LEAGUE_ADMIN") {
      if (!actorLeague || existing.leagueId !== actorLeague) {
        return { success: false, error: "No puedes eliminar clubes fuera de tu liga." };
      }
    }
    if (context.role === "SUPER_ADMIN") {
      if (!actorLeague || existing.leagueId !== actorLeague) {
        return {
          success: false,
          error: "Este club no pertenece a la liga activa. Cambia de liga en la barra superior.",
        };
      }
    }

    await clubRepository.delete(clubId);
    revalidateTag("clubs-list", "max");
    revalidatePath("/liga/clubs/", "page" as any);
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"],
);

export async function eliminarClubFormAction(formData: FormData): Promise<void> {
  await eliminarClubAction(formData);
}

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
      const supabase = await createSupabaseServerFromCookies();

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
    } catch (error: unknown) {
      console.error("Error en registrarMovimientoAction:", error);
      return { success: false, error: formatActionError(error) };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN", "CLUB_DELEGATE"],
);
