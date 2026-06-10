/**
 * Barrel de compatibilidad — acciones divididas en módulos por dominio (Fase 6).
 * @see clubs.actions.ts, players.actions.ts, settings.actions.ts
 */
export {
  createClubAsSystemAction,
  crearCategoriaAction,
  eliminarCategoriaAction,
  eliminarCategoriaFormAction,
  actualizarCategoriaAction,
  eliminarClubAction,
  eliminarClubFormAction,
  registrarMovimientoAction,
} from "@/lib/actions/clubs.actions";

export {
  registrarJugadorAction,
  editarDeportistaAction,
  eliminarDeportistaAction,
} from "@/lib/actions/players.actions";

export {
  getTransferStatusAction,
  toggleTransferOverrideAction,
  getLeagueSettingsAction,
  seedLeagueSettingsAction,
} from "@/lib/actions/settings.actions";

export type { PublicLeagueSettings } from "@/lib/actions/settings.actions";
