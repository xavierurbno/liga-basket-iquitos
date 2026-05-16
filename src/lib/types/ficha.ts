export type GenerateFichaPDFJugador = {
  name: string;
  lastname: string;
  documentType: string;
  documentNumber: string;
  fechaNacimientoIso: string;
  photoUrl: string | null;
  jerseyNumber: number | null;
};

export type GenerateFichaPDFProps = {
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
  clubName: string;
  clubLogoUrl: string | null;
  categoriaDetalle: string;
  players: FichaVistaPreviaJugador[];
  entrenador: FichaStaff;
  delegado: FichaStaff;
};
