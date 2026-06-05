"use server";

import {
  getInstitutionalLogosAction,
  type InstitutionalLogosResult,
} from "@/lib/actions/assets";
import {
  getEntityValidationUrlAction,
  getPlayersValidationUrlsAction,
} from "@/lib/actions/validation-url";

export type PrepareFichaPdfDataSuccess = {
  ok: true;
  logos: Extract<InstitutionalLogosResult, { success: true }>;
  playerUrls: Record<string, string>;
  categoryValidationUrl: string | null;
};

export type PrepareFichaPdfDataResult =
  | PrepareFichaPdfDataSuccess
  | { ok: false; error: string };

/** Una sola petición al servidor para logos + URLs de validación (evita 3 POST y timeouts). */
export async function prepareFichaPdfDataAction(
  leagueId: string | null | undefined,
  categoryId: string,
  playerIds: string[],
): Promise<PrepareFichaPdfDataResult> {
  try {
    const [logosRes, playerUrlsRes, categoryRes] = await Promise.all([
      getInstitutionalLogosAction(leagueId),
      getPlayersValidationUrlsAction(playerIds),
      getEntityValidationUrlAction(categoryId, "category"),
    ]);

    if (!logosRes.success) {
      return { ok: false, error: logosRes.error };
    }
    if (!playerUrlsRes.ok) {
      return { ok: false, error: playerUrlsRes.error };
    }

    return {
      ok: true,
      logos: logosRes,
      playerUrls: playerUrlsRes.urls,
      categoryValidationUrl: categoryRes.ok ? categoryRes.url : null,
    };
  } catch (error) {
    console.error("[prepareFichaPdfDataAction]", error);
    return {
      ok: false,
      error: "No se pudo preparar los datos del PDF. Revisa tu conexión e inténtalo de nuevo.",
    };
  }
}
