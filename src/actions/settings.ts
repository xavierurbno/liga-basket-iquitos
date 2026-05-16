"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { settingsRepository } from "@/repositories/settingsRepository";
import { revalidatePath } from "next/cache";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { User } from "@supabase/supabase-js";

/**
 * Esquema de validación para las configuraciones de la liga.
 */
const leagueSettingsSchema = z.object({
  leagueId: z.string().uuid("ID de liga inválido"),
  seasonName: z.string().min(1, "El nombre de la temporada es requerido").max(100, "Nombre demasiado largo"),
  pointsWin: z.coerce.number().int().min(0, "Los puntos deben ser positivos").max(10, "Máximo 10 puntos"),
  pointsLoss: z.coerce.number().int().min(0, "Los puntos deben ser positivos").max(10, "Máximo 10 puntos"),
  pointsWalkover: z.coerce.number().int().min(0, "Los puntos deben ser positivos").max(10, "Máximo 10 puntos"),
  maxPlayersPerClub: z.coerce.number().int().min(1, "Mínimo 1 jugador por club").max(100, "Máximo 100 jugadores"),
  bannerText: z.string().max(500, "El banner es demasiado largo").optional(),
  loginLogoUrl: z.string().optional(),
});

export type SettingsActionState = {
  success?: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

/**
 * Server Action para actualizar las configuraciones globales de una liga.
 */
export const updateLeagueSettingsAction = withAuth(
  async (
    prevState: SettingsActionState, 
    formData: FormData, 
    _user: User, 
    context: AuthContext
  ): Promise<SettingsActionState> => {
    
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

    // 1. Preparar datos
    const leagueId = (formData.get("leagueId") as string) || context.leagueId;
    const loginLogoFile = formData.get("loginLogo") as File | null;
    const loginLogoUrl = (formData.get("currentLoginLogoUrl") as string) || "";

    const rawData = {
      leagueId,
      seasonName: formData.get("seasonName"),
      pointsWin: formData.get("pointsWin"),
      pointsLoss: formData.get("pointsLoss"),
      pointsWalkover: formData.get("pointsWalkover"),
      maxPlayersPerClub: formData.get("maxPlayersPerClub"),
      bannerText: formData.get("bannerText"),
      loginLogoUrl,
    };

    // 2. Validación
    const validated = leagueSettingsSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        message: "Error de validación: Por favor revisa los campos marcados.",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    try {
      const { leagueId: vLeagueId, ...data } = validated.data;
      
      // 3. Seguridad
      if (context.role === "LEAGUE_ADMIN" && context.leagueId !== vLeagueId) {
        return { success: false, message: "Acceso denegado." };
      }

      // 4. Procesar Logo de Marca Blanca
      if (loginLogoFile && loginLogoFile.size > 0) {
        const fileExt = loginLogoFile.name.split(".").pop() || "png";
        const fileName = `${vLeagueId}/white-label-login.${fileExt}`;
        const bucketName = process.env.NEXT_PUBLIC_BUCKET_ASSETS || "club-assets";

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(`leagues/${fileName}`, loginLogoFile, {
            upsert: true,
            contentType: loginLogoFile.type,
          });

        if (uploadError) throw new Error(`Error subiendo logo: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`leagues/${fileName}`);

        data.loginLogoUrl = publicUrl;
      }

      // 5. Persistencia
      await settingsRepository.updateLeagueSettings(vLeagueId, data);
      
      revalidatePath("/liga/");
      revalidatePath("/", "page");
      revalidatePath("/login");
      
      return {
        success: true,
        message: "Configuración actualizada correctamente.",
      };
    } catch (error: unknown) {
      console.error("[SETTINGS_ACTION_ERROR]", error);
      const message = error instanceof Error ? error.message : "Error inesperado al procesar la solicitud.";
      return {
        success: false,
        message,
      };
    }
  },
  ["SUPER_ADMIN", "LEAGUE_ADMIN"]
);
