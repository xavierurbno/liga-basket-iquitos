"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { settingsRepository } from "@/repositories/settingsRepository";
import { revalidatePath } from "next/cache";
import { withAuth, AuthContext } from "@/lib/auth/withAuth";
import { User } from "@supabase/supabase-js";
import { CARNET_THEME_PRESETS, parseCarnetThemePreset } from "@/lib/carnet/carnetTheme";
import { normalizePortalHexColor } from "@/lib/leagues/league-branding";
import { revalidateLeagueBrandingPaths } from "@/lib/leagues/revalidate-portal-branding";
import { leagueRepository } from "@/repositories/league.repository";
import {
  LEAGUE_SOCIAL_FORM_FIELDS,
  normalizeLeagueSocialSettings,
} from "@/lib/leagues/league-social-links";

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
  portalPrimaryColor: z
    .string()
    .optional()
    .refine((v) => !v?.trim() || /^#[0-9A-Fa-f]{6}$/.test(v.trim()), {
      message: "Color primario inválido (formato #RRGGBB)",
    }),
  portalAccentColor: z
    .string()
    .optional()
    .refine((v) => !v?.trim() || /^#[0-9A-Fa-f]{6}$/.test(v.trim()), {
      message: "Color de acento inválido (formato #RRGGBB)",
    }),
  carnetFederationLogoUrl: z.string().optional(),
  presidentSignatureUrl: z.string().optional(),
  secretarySignatureUrl: z.string().optional(),
  presidentDisplayName: z.string().max(120, "Nombre demasiado largo").optional(),
  secretaryDisplayName: z.string().max(120, "Nombre demasiado largo").optional(),
  carnetValidityLabel: z.string().max(80, "Vigencia demasiado larga").optional(),
  carnetAuthorizationTemplate: z.string().max(600, "Texto legal demasiado largo").optional(),
  carnetThemePreset: z
    .string()
    .optional()
    .refine(
      (v) => !v?.trim() || (CARNET_THEME_PRESETS as readonly string[]).includes(v.trim()),
      { message: "Plantilla de carnet inválida" },
    ),
  carnetShowFederation: z.boolean().optional(),
  carnetFederationDisplayName: z.string().max(200, "Nombre de federación demasiado largo").optional(),
  carnetSportLabel: z.string().max(40, "Etiqueta demasiado larga").optional(),
  carnetSportGraphicUrl: z.string().optional(),
  socialFacebookUrl: z.string().max(500).optional(),
  socialInstagramUrl: z.string().max(500).optional(),
  socialYoutubeUrl: z.string().max(500).optional(),
  socialTiktokUrl: z.string().max(500).optional(),
  socialWhatsappUrl: z.string().max(500).optional(),
});

async function uploadLeagueCarnetAsset(
  supabase: ReturnType<typeof createServerClient>,
  leagueId: string,
  file: File,
  assetName: string,
): Promise<string> {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = ["png", "jpg", "jpeg", "webp"].includes(fileExt) ? fileExt : "png";
  const storagePath = `leagues/${leagueId}/carnet/${assetName}.${safeExt}`;
  const bucketName = process.env.NEXT_PUBLIC_BUCKET_ASSETS || "club-assets";

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type || `image/${safeExt === "jpg" ? "jpeg" : safeExt}`,
    });

  if (uploadError) {
    throw new Error(`Error subiendo ${assetName}: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
  return publicUrl;
}

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
    const carnetFederationLogoFile = formData.get("carnetFederationLogo") as File | null;
    const carnetSportGraphicFile = formData.get("carnetSportGraphic") as File | null;
    const presidentSignatureFile = formData.get("presidentSignature") as File | null;
    const secretarySignatureFile = formData.get("secretarySignature") as File | null;

    const rawData = {
      leagueId,
      seasonName: formData.get("seasonName"),
      pointsWin: formData.get("pointsWin"),
      pointsLoss: formData.get("pointsLoss"),
      pointsWalkover: formData.get("pointsWalkover"),
      maxPlayersPerClub: formData.get("maxPlayersPerClub"),
      bannerText: formData.get("bannerText"),
      loginLogoUrl,
      portalPrimaryColor: formData.get("portalPrimaryColor"),
      portalAccentColor: formData.get("portalAccentColor"),
      carnetFederationLogoUrl: (formData.get("currentCarnetFederationLogoUrl") as string) || "",
      presidentSignatureUrl: (formData.get("currentPresidentSignatureUrl") as string) || "",
      secretarySignatureUrl: (formData.get("currentSecretarySignatureUrl") as string) || "",
      presidentDisplayName: formData.get("presidentDisplayName"),
      secretaryDisplayName: formData.get("secretaryDisplayName"),
      carnetValidityLabel: formData.get("carnetValidityLabel"),
      carnetAuthorizationTemplate: formData.get("carnetAuthorizationTemplate"),
      carnetThemePreset: formData.get("carnetThemePreset"),
      carnetShowFederation: formData.get("carnetShowFederation") === "on",
      carnetFederationDisplayName: formData.get("carnetFederationDisplayName"),
      carnetSportLabel: formData.get("carnetSportLabel"),
      carnetSportGraphicUrl: (formData.get("currentCarnetSportGraphicUrl") as string) || "",
      socialFacebookUrl: formData.get("socialFacebookUrl"),
      socialInstagramUrl: formData.get("socialInstagramUrl"),
      socialYoutubeUrl: formData.get("socialYoutubeUrl"),
      socialTiktokUrl: formData.get("socialTiktokUrl"),
      socialWhatsappUrl: formData.get("socialWhatsappUrl"),
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

      if (carnetFederationLogoFile && carnetFederationLogoFile.size > 0) {
        data.carnetFederationLogoUrl = await uploadLeagueCarnetAsset(
          supabase,
          vLeagueId,
          carnetFederationLogoFile,
          "federation-logo",
        );
      }

      if (carnetSportGraphicFile && carnetSportGraphicFile.size > 0) {
        data.carnetSportGraphicUrl = await uploadLeagueCarnetAsset(
          supabase,
          vLeagueId,
          carnetSportGraphicFile,
          "sport-graphic",
        );
      }

      if (presidentSignatureFile && presidentSignatureFile.size > 0) {
        data.presidentSignatureUrl = await uploadLeagueCarnetAsset(
          supabase,
          vLeagueId,
          presidentSignatureFile,
          "president-signature",
        );
      }

      if (secretarySignatureFile && secretarySignatureFile.size > 0) {
        data.secretarySignatureUrl = await uploadLeagueCarnetAsset(
          supabase,
          vLeagueId,
          secretarySignatureFile,
          "secretary-signature",
        );
      }

      data.presidentDisplayName = (data.presidentDisplayName ?? "").trim();
      data.secretaryDisplayName = (data.secretaryDisplayName ?? "").trim();
      data.carnetValidityLabel = (data.carnetValidityLabel ?? "").trim();
      data.carnetAuthorizationTemplate = (data.carnetAuthorizationTemplate ?? "").trim();
      data.carnetThemePreset = parseCarnetThemePreset(data.carnetThemePreset);
      data.carnetFederationDisplayName = (data.carnetFederationDisplayName ?? "").trim();
      data.carnetSportLabel = (data.carnetSportLabel ?? "").trim();

      data.portalPrimaryColor = normalizePortalHexColor(
        data.portalPrimaryColor,
        "#1e3a5f",
      );
      data.portalAccentColor = normalizePortalHexColor(data.portalAccentColor, "#005CEE");

      const socialErrors: Record<string, string[]> = {};
      const normalizedSocial = normalizeLeagueSocialSettings({
        socialFacebookUrl: String(rawData.socialFacebookUrl ?? ""),
        socialInstagramUrl: String(rawData.socialInstagramUrl ?? ""),
        socialYoutubeUrl: String(rawData.socialYoutubeUrl ?? ""),
        socialTiktokUrl: String(rawData.socialTiktokUrl ?? ""),
        socialWhatsappUrl: String(rawData.socialWhatsappUrl ?? ""),
      });

      for (const field of LEAGUE_SOCIAL_FORM_FIELDS) {
        const raw = String(rawData[field.name] ?? "").trim();
        if (!raw) continue;
        const normalized = normalizedSocial[field.name];
        if (!normalized) {
          socialErrors[field.name] = [`${field.label}: enlace o número no válido.`];
        }
      }

      if (Object.keys(socialErrors).length > 0) {
        return {
          success: false,
          message: "Revisa los enlaces de redes sociales.",
          errors: socialErrors,
        };
      }

      Object.assign(data, normalizedSocial);

      // 5. Persistencia
      await settingsRepository.updateLeagueSettings(vLeagueId, data);

      const leagueRow = await leagueRepository.findById(vLeagueId);
      revalidateLeagueBrandingPaths(leagueRow?.slug);
      revalidatePath("/liga/");
      revalidatePath("/liga/configuracion/");
      revalidatePath("/super-admin/leagues");
      revalidatePath(`/super-admin/leagues/${vLeagueId}`);
      
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
