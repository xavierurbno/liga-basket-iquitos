"use server";

import { db } from "@/lib/db/client";
import { clubs, ownershipHistory } from "@/lib/db/schema";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function requireUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  return user;
}

export async function createClubAction(formData: FormData) {
  try {
    const user = await requireUser();
    
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const presidentDocumentType = formData.get("presidentDocumentType") as string;
    const presidentDocumentNumber = formData.get("presidentDocumentNumber") as string;
    const presidentName = formData.get("presidentName") as string;

    if (!name || !slug || !presidentDocumentType || !presidentDocumentNumber || !presidentName) {
      return { error: "Todos los campos son obligatorios" };
    }

    // Insertar club con owner_id
    const result = await db.insert(clubs).values({
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      presidentDocumentType: presidentDocumentType as any,
      presidentDocumentNumber,
      presidentName,
      adminEmail: user.email || "",
      ownerId: user.id,
    }).returning({ slug: clubs.slug });

    return { success: true, slug: result[0].slug };
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
    const currentUser = await requireUser();

    // Validar que el current user es dueño del club actual
    const club = await db.select().from(clubs).where(eq(clubs.id, clubId)).limit(1);
    if (!club.length || club[0].ownerId !== currentUser.id) {
      return { error: "No tienes permiso para transferir este club" };
    }

    // Validar que el nuevo correo existe en auth.users
    const result = await db.execute(sql`SELECT id FROM auth.users WHERE email = ${newOwnerEmail}`);
    const newOwnerId = result[0]?.id as string | undefined;

    if (!newOwnerId) {
      return { error: "El correo ingresado no pertenece a ningún usuario registrado en el sistema. Debe registrarse primero." };
    }

    const existingClub = await db.select().from(clubs).where(eq(clubs.ownerId, newOwnerId)).limit(1);
    if (existingClub.length > 0) {
      return { error: "El usuario ya es responsable de otro club" };
    }

    // Transferir propiedad y registrar historial
    await db.transaction(async (tx) => {
      await tx.update(clubs).set({ ownerId: newOwnerId }).where(eq(clubs.id, clubId));
      
      await tx.insert(ownershipHistory).values({
        clubId: clubId,
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
