export type GenerateFichaPDFJugador = {
  id: string;
  name: string;
  lastname: string;
  documentType: string;
  documentNumber: string;
  fechaNacimientoIso: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
};

export type GenerateFichaPDFProps = {
  leagueId?: string | null;
  /** Misma URL que la vista previa; respaldo si el servidor no resuelve `login_logo_url`. */
  leagueLogoUrl?: string | null;
  /** Nombre oficial de la liga (cabecera PDF). */
  leagueDisplayName: string;
  fileName: string;
  teamId: string;
  clubName: string;
  /** Logo del club (sello en la fila identidad del PDF). */
  clubLogoUrl: string | null;
  /** Ej. "U9 - MIXTO" */
  categoriaDetalle: string;
  coachName: string | null;
  coachLastname: string | null;
  coachDocumentType: string | null;
  coachDocumentNumber: string | null;
  coachPhotoUrl: string | null;
  delegateName: string | null;
  delegateLastname: string | null;
  delegateDocumentType: string | null;
  delegateDocumentNumber: string | null;
  delegatePhotoUrl: string | null;
  players: GenerateFichaPDFJugador[];
};

export type FichaVistaPreviaJugador = {
  id: string;
  name: string;
  lastname: string;
  documentType: string;
  documentNumber: string;
  fechaNacimientoIso: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
};

export type FichaStaff = {
  name: string | null;
  lastname: string | null;
  documentType: string | null;
  documentNumber: string | null;
  photoUrl: string | null;
};

export type FichaVistaPreviaProps = {
  leagueDisplayName: string;
  /** Logo de la liga (cabecera y marca de agua). */
  leagueLogoUrl: string;
  clubName: string;
  clubLogoUrl: string | null;
  categoriaDetalle: string;
  players: FichaVistaPreviaJugador[];
  entrenador: FichaStaff;
  delegado: FichaStaff;
};
