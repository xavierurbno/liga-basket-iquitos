"use server";

import { db } from "@/lib/db/client";
import { clubs, ownershipHistory } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/require-auth";
import { isSystemOwnerEmail } from "@/lib/auth/system-owner";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function createClubAction(formData: FormData) {
  try {
    const auth = await requireAuth(["CLUB_DELEGATE"]);
    if (auth.denied) {
      return { error: auth.error };
    }

    const user = auth.user;
    const leagueIdFromMeta = auth.context.leagueId?.trim() || null;

    if (!leagueIdFromMeta) {
      return {
        error:
          "Tu cuenta no tiene liga asignada. Un administrador debe invitarte con rol de delegado antes de registrar un club.",
      };
    }

    const existingOwned = await db
      .select({ id: clubs.id })
      .from(clubs)
      .where(eq(clubs.ownerId, user.id))
      .limit(1);
    if (existingOwned.length > 0) {
      return { error: "Ya eres responsable de un club registrado." };
    }

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const presidentDocumentType = formData.get("presidentDocumentType") as string;
    const presidentDocumentNumber = formData.get("presidentDocumentNumber") as string;
    const presidentName = formData.get("presidentName") as string;

    if (!name || !slug || !presidentDocumentType || !presidentDocumentNumber || !presidentName) {
      return { error: "Todos los campos son obligatorios" };
    }

    const result = await db
      .insert(clubs)
      .values({
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        presidentDocumentType: presidentDocumentType as "DNI" | "CE" | "PASAPORTE",
        presidentDocumentNumber,
        presidentName,
        adminEmail: user.email || "",
        ownerId: user.id,
        leagueId: leagueIdFromMeta,
      })
      .returning({ slug: clubs.slug, id: clubs.id });

    return { success: true, slug: result[0].slug, clubId: result[0].id };
  } catch (error: unknown) {
    console.error("Error al crear club:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Error al registrar el club" };
  }
}

export async function transferClubOwnershipAction(clubId: string, newOwnerEmail: string) {
  try {
    const auth = await requireAuth(["CLUB_DELEGATE"]);
    if (auth.denied) {
      return { error: auth.error };
    }

    const currentUser = auth.user;
    const targetClubId = clubId?.trim();
    const emailNorm = newOwnerEmail?.trim().toLowerCase();
    if (!targetClubId || !emailNorm) {
      return { error: "Datos incompletos para transferir el club." };
    }

    const club = await db.select().from(clubs).where(eq(clubs.id, targetClubId)).limit(1);
    if (!club.length || club[0].ownerId !== currentUser.id) {
      return { error: "No tienes permiso para transferir este club" };
    }

    if (auth.context.clubId && auth.context.clubId !== targetClubId && !isSystemOwnerEmail(currentUser.email)) {
      return { error: "No puedes transferir un club ajeno a tu cuenta." };
    }

    const result = await db.execute(sql`SELECT id FROM auth.users WHERE email = ${emailNorm}`);
    const newOwnerId = result[0]?.id as string | undefined;

    if (!newOwnerId) {
      return {
        error:
          "El correo ingresado no pertenece a ningún usuario registrado en el sistema. Debe registrarse primero.",
      };
    }

    const existingClub = await db
      .select({ id: clubs.id })
      .from(clubs)
      .where(eq(clubs.ownerId, newOwnerId))
      .limit(1);
    if (existingClub.length > 0) {
      return { error: "El usuario ya es responsable de otro club" };
    }

    await db.transaction(async (tx) => {
      await tx.update(clubs).set({ ownerId: newOwnerId }).where(eq(clubs.id, targetClubId));

      await tx.insert(ownershipHistory).values({
        clubId: targetClubId,
        previousOwnerId: currentUser.id,
        newOwnerId: newOwnerId,
        registeredBy: currentUser.id,
      });
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error al transferir propiedad:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Error interno al transferir" };
  }
}
