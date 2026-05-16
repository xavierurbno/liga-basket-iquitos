export type LastPlayerDraft = {
  documentType: string;
  documentNumber: string;
  birthdate: string;
  lastname: string;
  name: string;
  contacto: string;
  numeroPolo: string;
};

export type PlayerInitialData = {
  playerId: string;
  documentType: string;
  documentNumber: string;
  birthdate: string;
  lastname: string;
  name: string;
  contacto: string;
  numeroPolo: string;
  fotoActual?: string;
};
