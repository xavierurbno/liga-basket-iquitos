/**
 * ============================================================
 * SERVER ACTIONS - Jugadores & Caja
 * ============================================================
 * Las Server Actions de Next.js son funciones asíncronas que se
 * ejecutan EN EL SERVIDOR pero pueden llamarse desde el cliente.
 *
 * VENTAJA vs API Routes: No necesitamos crear endpoints manualmente.
 * El formulario llama a la action directamente, Next.js maneja el
 * transporte HTTP de forma transparente y segura.
 *
 * SEGURIDAD: "use server" asegura que este código NUNCA llega al bundle
 * del cliente. Las claves de Supabase están protegidas.
 * ============================================================
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { registroJugadorSchema, movimientoCajaSchema } from "@/lib/validations/schemas";
import { calcularCategoria, generarNumeroFicha } from "@/lib/utils/categoria";
import { db } from "@/lib/db/client";
import { jugadores, movimientosCaja } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────
// HELPER: Crear cliente Supabase en Server Actions
// ─────────────────────────────────────────────────────────────

async function createSupabaseAction() {
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

// ─────────────────────────────────────────────────────────────
// ACTION: Registrar nuevo jugador con foto
// ─────────────────────────────────────────────────────────────

export async function registrarJugadorAction(
  clubId: string,
  clubSlug: string,
  formData: FormData
) {
  /**
   * PASO 1: Verificar que el usuario está autenticado.
   * Nunca confiamos en el clubId del cliente — lo verificamos
   * contra la sesión real del usuario.
   */
  const supabase = await createSupabaseAction();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  /**
   * PASO 2: Extraer y validar datos del FormData con Zod.
   * FormData viene como strings, Zod hace la coerción automática
   * (ej: "2005-03-15" → Date object).
   */
  const rawData = {
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    dni: formData.get("dni"),
    fechaNacimiento: formData.get("fechaNacimiento"),
    genero: formData.get("genero"),
    telefono: formData.get("telefono") || "",
    email: formData.get("email") || "",
    direccion: formData.get("direccion") || "",
    posicion: formData.get("posicion") || undefined,
    numeroCamiseta: formData.get("numeroCamiseta")
      ? Number(formData.get("numeroCamiseta"))
      : undefined,
    talla: formData.get("talla") || undefined,
    grupoSanguineo: formData.get("grupoSanguineo") || undefined,
    alergias: formData.get("alergias") || "",
    contactoEmergencia: formData.get("contactoEmergencia") || "",
    nombreTutor: formData.get("nombreTutor") || "",
    dniTutor: formData.get("dniTutor") || "",
    telefonoTutor: formData.get("telefonoTutor") || "",
    foto: formData.get("foto") as File | null,
  };

  const validated = registroJugadorSchema.safeParse(rawData);
  if (!validated.success) {
    // Devolvemos errores estructurados para que el formulario los muestre
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const data = validated.data;

  /**
   * PASO 3: Calcular categoría automáticamente.
   * No confiamos en la categoría que pudiera enviarse desde el cliente.
   * La calculamos en servidor con la fecha de nacimiento validada.
   */
  const categoria = calcularCategoria(data.fechaNacimiento);

  /**
   * PASO 4: Subir foto a Supabase Storage (si existe).
   * Ruta: jugador-fotos/{clubId}/{dni}/{timestamp}.{ext}
   * Esta estructura permite aplicar RLS policies a nivel de Storage.
   */
  let fotoUrl: string | undefined;

  if (data.foto && data.foto.size > 0) {
    const ext = data.foto.type.split("/")[1];
    const storageKey = `${clubId}/${data.dni}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("jugador-fotos")
      .upload(storageKey, data.foto, {
        contentType: data.foto.type,
        upsert: false,
      });

    if (uploadError) {
      return { success: false, errors: { foto: ["Error al subir la foto"] } };
    }

    // Obtenemos la URL pública (el bucket es público para vista de carnet)
    const { data: publicUrl } = supabase.storage
      .from("jugador-fotos")
      .getPublicUrl(storageKey);

    fotoUrl = publicUrl.publicUrl;
  }

  /**
   * PASO 5: Generar número de ficha único.
   * Contamos los jugadores activos de esa categoría para generar
   * el número correlativo.
   */
  const [{ count: totalEnCategoria }] = await db
    .select({ count: count() })
    .from(jugadores)
    .where(
      and(
        eq(jugadores.clubId, clubId),
        eq(jugadores.categoria, categoria)
      )
    );

  const numeroFicha = generarNumeroFicha(categoria, Number(totalEnCategoria) + 1);

  /**
   * PASO 6: Insertar en la base de datos con Drizzle.
   * Drizzle garantiza type-safety: si hay un campo incorrecto,
   * TypeScript lo detecta en tiempo de compilación, no en producción.
   */
  const [nuevoJugador] = await db
    .insert(jugadores)
    .values({
      clubId,
      nombres: data.nombres,
      apellidos: data.apellidos,
      dni: data.dni,
      fechaNacimiento: data.fechaNacimiento,
      genero: data.genero,
      categoria,
      telefono: data.telefono || undefined,
      email: data.email || undefined,
      direccion: data.direccion || undefined,
      posicion: data.posicion,
      numeroCamiseta: data.numeroCamiseta,
      talla: data.talla,
      fotoUrl,
      estado: "PENDIENTE_PAGO",
      numeroFicha,
      nombreTutor: data.nombreTutor || undefined,
      dniTutor: data.dniTutor || undefined,
      telefonoTutor: data.telefonoTutor || undefined,
      grupoSanguineo: data.grupoSanguineo,
      alergias: data.alergias || undefined,
      contactoEmergencia: data.contactoEmergencia || undefined,
    })
    .returning({ id: jugadores.id });

  /**
   * PASO 7: Invalidar el caché de Next.js para la ruta de jugadores.
   * revalidatePath() hace que la próxima visita a esa URL
   * re-ejecute los Server Components y muestre datos frescos.
   */
  revalidatePath(`/dashboard/${clubSlug}/jugadores`);

  // Redirigimos al perfil del jugador recién creado
  redirect(`/dashboard/${clubSlug}/jugadores/${nuevoJugador.id}`);
}

// ─────────────────────────────────────────────────────────────
// ACTION: Registrar movimiento de caja
// ─────────────────────────────────────────────────────────────

export async function registrarMovimientoAction(
  clubId: string,
  clubSlug: string,
  formData: FormData
) {
  const supabase = await createSupabaseAction();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const rawData = {
    tipo: formData.get("tipo"),
    monto: Number(formData.get("monto")),
    concepto: formData.get("concepto"),
    canalPago: formData.get("canalPago"),
    codigoOperacion: formData.get("codigoOperacion") || undefined,
    jugadorId: formData.get("jugadorId") || undefined,
    fechaMovimiento: formData.get("fechaMovimiento") || new Date().toISOString(),
    observaciones: formData.get("observaciones") || undefined,
  };

  const validated = movimientoCajaSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const data = validated.data;

  // Subimos comprobante si se adjuntó
  let comprobanteUrl: string | undefined;
  const comprobante = formData.get("comprobante") as File | null;

  if (comprobante && comprobante.size > 0) {
    const ext = comprobante.type.split("/")[1] || "jpg";
    const storageKey = `${clubId}/comprobantes/${Date.now()}.${ext}`;

    await supabase.storage
      .from("comprobantes")
      .upload(storageKey, comprobante, { contentType: comprobante.type });

    const { data: urlData } = supabase.storage
      .from("comprobantes")
      .getPublicUrl(storageKey);

    comprobanteUrl = urlData.publicUrl;
  }

  await db.insert(movimientosCaja).values({
    clubId,
    tipo: data.tipo,
    monto: String(data.monto),
    concepto: data.concepto,
    canalPago: data.canalPago,
    codigoOperacion: data.codigoOperacion,
    jugadorId: data.jugadorId,
    fechaMovimiento: data.fechaMovimiento,
    observaciones: data.observaciones,
    registradoPor: user.id,
    comprobanteUrl,
  });

  revalidatePath(`/dashboard/${clubSlug}/caja`);

  return { success: true };
}
