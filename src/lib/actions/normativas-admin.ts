"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { withAuth, type AuthContext } from "@/lib/auth/withAuth";
import type { ActionResult } from "@/lib/types/league";
import { db } from "@/lib/db/client";
import { normativas, type NormativaCategoria } from "@/lib/db/schema";

const ALLOWED_CATEGORY = new Set<string>(["REGLAMENTO", "BASES", "COMUNICADO"]);

function asText(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export const createNormativaDocumentAction = withAuth(
  async (formData: FormData, _user: User, _context: AuthContext): Promise<ActionResult> => {
    const title = asText(formData.get("title"));
    const description = asText(formData.get("description"));
    const categoryRaw = asText(formData.get("category"));
    const isPublic = formData.get("isPublic") === "true" || formData.get("isPublic") === "on";
    const file = formData.get("file");

    if (!title) return { success: false, error: "El título es obligatorio." };
    if (!ALLOWED_CATEGORY.has(categoryRaw)) {
      return { success: false, error: "Categoría no válida." };
    }
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Selecciona un archivo (PDF recomendado)." };
    }

    const bucket =
      process.env.NEXT_PUBLIC_BUCKET_NORMATIVAS?.trim() ||
      process.env.NEXT_PUBLIC_BUCKET_ASSETS?.trim() ||
      "Nomativa";

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

    const extRaw = file.name.includes(".") ? file.name.split(".").pop() ?? "pdf" : "pdf";
    const ext = extRaw.toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
    const key = `normativas/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(key, file, {
      upsert: false,
      contentType: file.type || "application/pdf",
    });
    if (uploadError) {
      return { success: false, error: `Error al subir el archivo: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(key);

    await db.insert(normativas).values({
      titulo: title,
      descripcion: description || null,
      urlArchivo: publicUrl,
      categoria: categoryRaw as NormativaCategoria,
      esPublico: isPublic,
    });

    revalidatePath("/normativas");
    revalidatePath("/normativas/");
    revalidatePath("/", "page");
    return { success: true };
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"]
);
