"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { sponsorRepository } from "@/repositories/sponsorRepository";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { User } from "@supabase/supabase-js";
import { ActionResult } from "@/lib/types/league";

const sponsorSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  category: z.enum([
    "SOCIOS_PATROCINADORES",
    "PATR_TECNICO",
    "PATROCINADORES_OFICIALES",
    "PROVEEDORES",
    "INSTITUCIONALES",
  ]),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  displayOrder: z.coerce.number().default(0),
});

export const getSponsorsByLeagueAction = async (leagueId: string) => {
  try {
    return await sponsorRepository.findByLeague(leagueId);
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return [];
  }
};

export const upsertSponsorAction = withAuth(
  async (formData: FormData, user: User, context: AuthContext): Promise<ActionResult> => {
    let uploadedKey: string | null = null;
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

    try {
      // SuperAdmin puede elegir la liga desde el formulario
      const leagueId = (formData.get("leagueId") as string | null)?.trim() || context.leagueId;
      if (!leagueId) {
        return { success: false, error: "Debes seleccionar una liga." };
      }

      const id = formData.get("id") as string | null;
      const name = formData.get("name") as string;
      const category = formData.get("category") as any;
      const websiteUrl = formData.get("websiteUrl") as string;
      const displayOrder = formData.get("displayOrder") as string;
      const logoFile = formData.get("logo") as File | null;

      console.log("[upsertSponsorAction] Received Data:", {
        id,
        name,
        category,
        logoSize: logoFile?.size,
        logoName: logoFile?.name,
        hasCurrentLogo: !!formData.get("currentLogoUrl")
      });

      const validated = sponsorSchema.safeParse({
        name,
        category,
        websiteUrl,
        displayOrder,
      });

      if (!validated.success) {
        const errorMessage = validated.error.issues[0]?.message || "Error de validación";
        return { success: false, error: errorMessage };
      }

      let logoUrl = formData.get("currentLogoUrl") as string;

      if (logoFile && logoFile.size > 0) {
        const ext = logoFile.name.split(".").pop() || "jpg";
        const fileId = crypto.randomUUID();
        uploadedKey = `sponsors/${fileId}.${ext}`;

        const bucketName = process.env.NEXT_PUBLIC_BUCKET_ASSETS || "club-assets";
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(uploadedKey, logoFile, {
            contentType: logoFile.type,
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Error al subir logo: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uploadedKey);

        logoUrl = publicUrl;
      }

      if (!logoUrl) {
        return { success: false, error: "El logo es requerido." };
      }

      if (id) {
        await sponsorRepository.update(id, {
          name: validated.data.name,
          category: validated.data.category,
          websiteUrl: validated.data.websiteUrl || null,
          displayOrder: validated.data.displayOrder,
          logoUrl,
        });
      } else {
        await sponsorRepository.create({
          leagueId,
          name: validated.data.name,
          category: validated.data.category,
          websiteUrl: validated.data.websiteUrl || null,
          displayOrder: validated.data.displayOrder,
          logoUrl,
        });
      }

      revalidatePath("/");
      revalidatePath("/liga/patrocinadores/");
      revalidatePath("/(admin)/super-admin/sponsors", "page");
      return { success: true };

    } catch (error: any) {
      console.error("Error in upsertSponsorAction:", error);

      // ROLLBACK DE STORAGE
      if (uploadedKey) {
        const bucketName = process.env.NEXT_PUBLIC_BUCKET_ASSETS || "club-assets";
        await supabase.storage.from(bucketName).remove([uploadedKey]);
      }

      return { success: false, error: error.message || "Error al procesar el patrocinador." };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"]
);

export const bulkUpsertSponsorsAction = withAuth(
  async (formData: FormData, user: User, context: AuthContext): Promise<ActionResult> => {
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

    const uploadedKeys: string[] = [];

    try {
      const files = formData.getAll("files") as File[];
      const metadataStr = formData.get("metadata") as string;
      const metadata = JSON.parse(metadataStr) as {
        name: string;
        category: any;
        leagueId: string;
        websiteUrl?: string;
        displayOrder?: number;
      }[];

      if (files.length !== metadata.length) {
        return { success: false, error: "La cantidad de archivos y metadatos no coincide." };
      }

      const bucketName = process.env.NEXT_PUBLIC_BUCKET_ASSETS || "club-assets";
      const newSponsors = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const meta = metadata[i];

        const ext = file.name.split(".").pop() || "jpg";
        const fileId = crypto.randomUUID();
        const key = `sponsors/${fileId}.${ext}`;
        uploadedKeys.push(key);

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(key, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) throw new Error(`Error subiendo ${file.name}: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(key);

        newSponsors.push({
          leagueId: meta.leagueId,
          name: meta.name,
          category: meta.category,
          websiteUrl: meta.websiteUrl || null,
          displayOrder: meta.displayOrder || 0,
          logoUrl: publicUrl,
        });
      }

      if (newSponsors.length > 0) {
        await sponsorRepository.createMany(newSponsors);
      }

      revalidatePath("/");
      revalidatePath("/liga/patrocinadores/");
      revalidatePath("/(admin)/super-admin/sponsors", "page");
      return { success: true };

    } catch (error: any) {
      console.error("Error in bulkUpsertSponsorsAction:", error);
      
      // Cleanup uploaded files on failure
      if (uploadedKeys.length > 0) {
        const bucketName = process.env.NEXT_PUBLIC_BUCKET_ASSETS || "club-assets";
        await supabase.storage.from(bucketName).remove(uploadedKeys);
      }

      return { success: false, error: error.message || "Error en la subida masiva." };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"]
);

export const deleteSponsorAction = withAuth(
  async (id: string, user: User, context: AuthContext): Promise<ActionResult> => {
    try {
      const sponsor = await sponsorRepository.findById(id);
      if (!sponsor) return { success: false, error: "Patrocinador no encontrado." };

      // Opcional: Eliminar del storage si se desea
      // const fileName = sponsor.logoUrl.split("/").pop();
      // if (fileName) {
      //   const bucketName = process.env.NEXT_PUBLIC_BUCKET_ASSETS || "club-assets";
      //   await supabase.storage.from(bucketName).remove([`sponsors/${fileName}`]);
      // }

      await sponsorRepository.delete(id);
      revalidatePath("/");
      revalidatePath("/liga/patrocinadores/");
      revalidatePath("/(admin)/super-admin/sponsors", "page");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Error al eliminar patrocinador." };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"]
);
