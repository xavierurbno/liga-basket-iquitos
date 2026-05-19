export type GenerateCarnetPDFProps = {
  playerId: string;
  fileName: string;
  name: string;
  lastname: string;
  documentType: string;
  documentNumber: string;
  fechaNacimientoIso: string;
  clubName: string;
  categoriaDetalle: string;
  carnetNumber: string | null;
  photoUrl: string | null;
  clubLogoUrl: string | null;
  /** Etiqueta del botón (tabla vs página dedicada). */
  label?: string;
  className?: string;
};
