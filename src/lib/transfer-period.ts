import { getCachedLeagueSettings } from "@/lib/data/cached-queries";

export async function assertTransferPeriodOpen(
  orgId?: string | null
): Promise<{ success: boolean; overrideIsOpen?: boolean; error?: string }> {
  // En un sistema real, el clubId / orgId podría utilizarse si la configuración fuera por club,
  // pero los pases son globales para la liga entera. Así que verificaremos la configuración general.

  try {
    const settings = await getCachedLeagueSettings();

    if (!settings) {
      // Si no hay configuración, por defecto cerrado.
      return { success: false, error: "No hay configuración del periodo de transferencias. Contacte al administrador." };
    }

    // Si manual override es true, siempre está abierto.
    if (settings.isManualOverride) {
      return { success: true, overrideIsOpen: true };
    }

    const now = new Date();

    const start = settings.transferPeriodStart;
    const end = settings.transferPeriodEnd;

    if (!start || !end) {
      return { success: false, error: "El periodo de transferencias no ha sido definido." };
    }

    if (now >= start && now <= end) {
      return { success: true, overrideIsOpen: false };
    }

    return { success: false, error: "El periodo de transferencias está cerrado actualmente." };
  } catch (error) {
    console.error("Error al consultar leagueSettings en The Lock:", error);
    // Fail-safe: si la tabla no existe o hay error de base de datos, mantenemos cerrado.
    return { success: false, error: "Error interno verificando el periodo de transferencias. Bloqueo de seguridad activado." };
  }
}
