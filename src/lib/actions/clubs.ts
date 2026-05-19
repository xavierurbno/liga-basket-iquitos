"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { galleryPhotos } from "@/lib/db/schema";
import { isSystemOwnerEmail } from "@/lib/auth/system-owner";
import { clubRepository } from "@/repositories/clubRepository";
import type { ActionResult } from "@/lib/types/league";
import { applyWatermark } from "@/lib/watermark";
import { GALLERY_SERVER_PROCESS_CHUNK, mapInChunks } from "@/lib/gallery/server-upload";
import { isDashboardSuperAdmin } from "@/lib/auth/dashboard-super-admin";

function textoIncluyeTenantNoEncontrado(e: unknown): boolean {
  const revisar = (s: string) =>
    s.includes("Tenant or user not found") || s.includes("tenant or user not found");
  if (typeof e === "object" && e !== null && "message" in e && typeof (e as Error).message === "string") {
    if (revisar((e as Error).message)) return true;
    const cause = (e as Error & { cause?: unknown }).cause;
    if (cause instanceof Error && revisar(cause.message)) return true;
  }
  return false;
}

/** Drizzle envuelve el fallo como "Failed query: …"; la causa útil suele estar en `cause`. */
function mensajeErrorDbParaUsuario(e: unknown): string {
  const mensajes: string[] = [];
  let current: unknown = e;
  for (let i = 0; i < 6 && current; i++) {
    if (current instanceof Error) {
      mensajes.push(current.message);
      current = (current as Error & { cause?: unknown }).cause;
    } else break;
  }
  const todo = mensajes.join(" ");

  if (todo.includes("does not exist") && todo.toLowerCase().includes("relation")) {
    return 'La tabla no existe en Postgres (esquema sin aplicar). En Supabase → SQL Editor ejecuta las migraciones del proyecto o `npm run push` contra esta base.';
  }

  if (todo.includes("ENOTFOUND") || todo.includes("getaddrinfo")) {
    return "Tu red no resolvió el host de Postgres (ENOTFOUND). Si usabas el host «db.….supabase.co», prueba sin DATABASE_USE_DIRECT_FIRST para priorizar DATABASE_URL_POOLED, o cambia DNS / VPN. Reinicia «npm run dev».";
  }

  if (todo.toLowerCase().includes("password authentication failed")) {
    return "La contraseña de la base de datos es incorrecta para esa URI. En Supabase > Database > Settings usa «Reset database password», copia de nuevo la cadena de conexión desde Connect y actualiza .env.local. Luego reinicia «npm run dev».";
  }

  const externo = mensajes[0]?.startsWith("Failed query:") ? mensajes[1] : undefined;
  if (externo) return externo;
  return mensajes[0] ?? "Error al crear el club.";
}

function slugifyNombre(name: string): string {
  const sinAcentos = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return sinAcentos.slice(0, 45);
}

async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

/**
 * Crea club + membresía ADMIN para el usuario (propietario del sistema).
 */
export async function crearClubComoPropietarioAction(formData: FormData) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email;
  if (!email) {
    return { success: false as const, error: "No autenticado." };
  }

  if (!isSystemOwnerEmail(email)) {
    return {
      success: false as const,
      error: "Your account does not have permission to create clubs from here.",
    };
  }

  let name =
    (formData.get("name") as string | null)?.trim() ||
    `Liga ${new Date().toLocaleDateString("es-PE")}`;

  if (name.length > 100) name = name.slice(0, 100);

  const baseSlug = slugifyNombre(name) || `liga-${Date.now().toString(36)}`;

  let slug = baseSlug.slice(0, 50);
  let sufijo = 0;
  let createdClubId = "";

  try {
    while (sufijo < 200) {
      const exists = await clubRepository.existsBySlug(slug);
      if (!exists) break;
      sufijo += 1;
      slug = `${baseSlug}-${sufijo}`.slice(0, 50);
    }

    if (sufijo >= 200) {
      return {
        success: false as const,
        error: "No se pudo generar una URL única. Intenta otro name.",
      };
    }

    await db.transaction(async (tx) => {
      const club = await clubRepository.create({
        name,
        slug,
        adminEmail: email,
      }, tx);

      if (!club) throw new Error("No se pudo crear el club.");
      createdClubId = club.id;

      await clubRepository.addMember({
        userId: user.id,
        clubId: club.id,
        role: "ADMIN",
        active: true,
      }, tx);
    });
  } catch (error: unknown) {
    if (textoIncluyeTenantNoEncontrado(error)) {
      return {
        success: false as const,
        error:
          "La base de datos rechazó la conexión (mensaje Supabase: «tenant or user not found»). Copia desde Supabase → Project Settings → Database la URI exacta del pooler transaccional (host como aws-0-… o aws-1-… según tu proyecto) y actualiza DATABASE_URL_POOLED; o usa DATABASE_URL_DIRECT con el host db.[ref].supabase.co:5432. Reinicia «npm run dev» tras cambiar .env.local.",
      };
    }
    return { success: false as const, error: mensajeErrorDbParaUsuario(error) };
  }

  revalidatePath("/");
  redirect(`/liga/clubs/${createdClubId}/`);
}

/* ──────────────────────────────────────────────────────────────────────────
 * uploadClubPhotosAction
 * Server Action: sube múltiples fotos vinculadas a un club específico.
 * - SuperAdmins pueden subir fotos para cualquier club.
 * - Club-owners sólo para su propio club (validación por owner_id).
 * ────────────────────────────────────────────────────────────────────────── */
export async function uploadClubPhotosAction(
  formData: FormData
): Promise<ActionResult> {
  try {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "No autenticado." };
    }

    const isSuperAdmin = isDashboardSuperAdmin(user);

    const clubId = (formData.get("clubId") as string | null)?.trim();
    const isUuid = clubId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clubId);

    if (!clubId || !isUuid) {
      return { success: false, error: "Debes seleccionar un club válido." };
    }

    // Validar que el club existe
    const club = await clubRepository.findById(clubId);
    if (!club) {
      return { success: false, error: "Club no encontrado." };
    }

    // Si no es SuperAdmin, verificar que sea el dueño del club
    if (!isSuperAdmin && club.ownerId !== user.id) {
      return {
        success: false,
        error: "No tienes permisos para subir fotos a este club.",
      };
    }

    if (!club.leagueId) {
      return { success: false, error: "El club no tiene una liga asignada." };
    }

    const files = formData.getAll("files") as File[];
    const caption = (formData.get("caption") as string | null)?.trim() || null;

    if (!files || files.length === 0) {
      return { success: false, error: "No se seleccionaron imágenes." };
    }

    // Cliente admin para bypass de RLS en Storage
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const bucket = process.env.NEXT_PUBLIC_BUCKET_GALLERY!;

    const uploadResults = await mapInChunks(files, GALLERY_SERVER_PROCESS_CHUNK, async (file) => {
      if (file.size === 0) return null;

      const rawBuffer = Buffer.from(await file.arrayBuffer());
      const watermarkedBuffer = await applyWatermark(rawBuffer);

      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const filePath = `gallery/${clubId}/${fileName}`;

      const { error: uploadError } = await adminClient.storage
        .from(bucket)
        .upload(filePath, watermarkedBuffer, { contentType: "image/jpeg", upsert: true });

      if (uploadError) {
        throw new Error(`Error en ${file.name}: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = adminClient.storage.from(bucket).getPublicUrl(filePath);

      return {
        url: publicUrl,
        caption,
        clubId,
        leagueId: club.leagueId,
        registeredBy: user.id,
      };
    });

    const validRows = uploadResults.filter(
      (r): r is NonNullable<typeof r> => r !== null
    );

    if (validRows.length === 0) {
      return { success: false, error: "No se procesaron imágenes válidas." };
    }

    // Batch insert con Drizzle
    await db.insert(galleryPhotos).values(validRows);

    revalidatePath("/liga/");
    revalidatePath("/liga/galeria-general");
    revalidatePath("/", "page");
    revalidatePath(`/liga/clubs/${club.id}/`);
    revalidatePath(`/liga/clubs/${club.id}/galeria`);

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al subir las fotos.";
    console.error("uploadClubPhotosAction error:", msg);
    return { success: false, error: msg };
  }
}
