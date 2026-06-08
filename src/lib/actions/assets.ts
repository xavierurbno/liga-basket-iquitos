"use server";

import sharp from "sharp";
import { assertInstitutionalAssetsForLeague } from "@/lib/auth/institutional-assets-access";
import { requireAuth } from "@/lib/auth/require-auth";
import type { Role } from "@/lib/auth/withAuth";
import { loadCarnetInstitutionalAssetsCore } from "@/lib/carnet/load-carnet-institutional-assets-core.server";
import type { CarnetInstitutionalAssetsResult } from "@/lib/types/carnet";
import {
  resolveFederationLogoForLeaguePngDataUrl,
  resolveLeagueLogoPngDataUrl,
} from "@/lib/logos/resolve-league-logo-buffer";
import { normalizePortalHexColor } from "@/lib/leagues/league-branding";
import {
  DEFAULT_PDF_ACCENT_RGB,
  DEFAULT_PDF_PRIMARY_RGB,
  hexToRgbTuple,
} from "@/lib/pdf/brand-colors";
import { settingsRepository } from "@/repositories/settingsRepository";
import { leagueRepository } from "@/repositories/league.repository";

const INSTITUTIONAL_ASSETS_ROLES: Role[] = [
  "SUPER_ADMIN",
  "LEAGUE_ADMIN",
  "CLUB_DELEGATE",
];

async function gateInstitutionalAssets(
  leagueId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth(INSTITUTIONAL_ASSETS_ROLES);
  if (auth.denied) return { ok: false, error: auth.error };

  const scope = await assertInstitutionalAssetsForLeague(auth.context, leagueId);
  if (!scope.ok) return { ok: false, error: scope.error };

  return { ok: true };
}

export type InstitutionalLogosResult =
  | {
      success: true;
      federacionBase64: string;
      ligaBase64: string | null;
      primaryRgb: [number, number, number];
      accentRgb: [number, number, number];
      /** Nombre oficial para encabezados y textos del PDF. */
      leagueDisplayName: string;
      seasonLabel: string;
    }
  | { success: false; error: string };

/**
 * Logos para PDFs: federación (global) + liga (`login_logo_url` por `leagueId`).
 */
export async function getInstitutionalLogosAction(
  leagueId?: string | null,
): Promise<InstitutionalLogosResult> {
  const leagueIdNorm = leagueId?.trim() || null;
  const gate = await gateInstitutionalAssets(leagueIdNorm);
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  try {
    const [fed, liga, settings, leagueRow] = await Promise.all([
      resolveFederationLogoForLeaguePngDataUrl(leagueIdNorm, 200),
      resolveLeagueLogoPngDataUrl(leagueIdNorm, 300),
      leagueIdNorm ? settingsRepository.getLeagueSettings(leagueIdNorm) : Promise.resolve(null),
      leagueIdNorm ? leagueRepository.findById(leagueIdNorm) : Promise.resolve(null),
    ]);

    if (!fed) {
      return {
        success: false,
        error: "No se pudo cargar el logo de la federación.",
      };
    }

    const primaryHex = normalizePortalHexColor(settings?.portalPrimaryColor, "#1e3a5f");
    const accentHex = normalizePortalHexColor(settings?.portalAccentColor, "#005CEE");
    const seasonLabel =
      settings?.seasonName?.trim() || `Temporada ${new Date().getFullYear()}`;
    const leagueDisplayName = leagueRow?.name?.trim() || "Liga deportiva";

    return {
      success: true,
      federacionBase64: fed,
      ligaBase64: liga,
      primaryRgb: hexToRgbTuple(primaryHex) ?? DEFAULT_PDF_PRIMARY_RGB,
      accentRgb: hexToRgbTuple(accentHex) ?? DEFAULT_PDF_ACCENT_RGB,
      leagueDisplayName,
      seasonLabel,
    };
  } catch (error) {
    console.error("Error cargando logos institucionales:", error);
    return {
      success: false,
      error: "No se pudieron cargar los logos institucionales.",
    };
  }
}

/**
 * Assets del carnet para consulta pública (/validar jugador). Sin autenticación.
 * Solo expone lo que ya figura en el carnet impreso.
 */
export async function getCarnetInstitutionalAssetsPublicAction(
  leagueId: string,
): Promise<CarnetInstitutionalAssetsResult> {
  const leagueIdNorm = leagueId?.trim();
  if (!leagueIdNorm) {
    return { success: false, error: "ID de liga inválido." };
  }

  try {
    return await loadCarnetInstitutionalAssetsCore(leagueIdNorm);
  } catch (error) {
    console.error("[getCarnetInstitutionalAssetsPublicAction]", error);
    return {
      success: false,
      error: "No se pudieron cargar los datos institucionales del carnet.",
    };
  }
}

/**
 * Contexto institucional + assets rasterizados para el carnet deportista (servidor).
 */
export async function getCarnetInstitutionalAssetsAction(
  leagueId: string,
): Promise<CarnetInstitutionalAssetsResult> {
  const leagueIdNorm = leagueId?.trim();
  if (!leagueIdNorm) {
    return { success: false, error: "ID de liga inválido." };
  }

  const gate = await gateInstitutionalAssets(leagueIdNorm);
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  try {
    return await loadCarnetInstitutionalAssetsCore(leagueIdNorm);
  } catch (error) {
    console.error("[getCarnetInstitutionalAssetsAction]", error);
    return {
      success: false,
      error: "No se pudieron cargar los datos institucionales del carnet.",
    };
  }
}
