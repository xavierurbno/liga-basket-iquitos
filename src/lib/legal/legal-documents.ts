export type LegalDocumentId = "terminos" | "privacidad";

export type LegalDocumentMeta = {
  id: LegalDocumentId;
  pathname: `/${string}/`;
  title: string;
  description: string;
  filename: `${LegalDocumentId}.md`;
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocumentMeta> = {
  terminos: {
    id: "terminos",
    pathname: "/terminos/",
    title: "Términos y Condiciones",
    description:
      "Condiciones de uso de la plataforma de gestión de ligas deportivas, servicios, responsabilidades y pagos externos.",
    filename: "terminos.md",
  },
  privacidad: {
    id: "privacidad",
    pathname: "/privacidad/",
    title: "Política de Privacidad y Protección de Datos",
    description:
      "Tratamiento de datos personales sin edad mínima, menores con consentimiento del apoderado, tarifas, derechos ARCO y Ley N° 29733.",
    filename: "privacidad.md",
  },
};

export const LEGAL_DOCUMENT_IDS = Object.keys(LEGAL_DOCUMENTS) as LegalDocumentId[];

export function isLegalDocumentId(value: string): value is LegalDocumentId {
  return LEGAL_DOCUMENT_IDS.includes(value as LegalDocumentId);
}

export function getLegalDocumentMeta(id: LegalDocumentId): LegalDocumentMeta {
  return LEGAL_DOCUMENTS[id];
}
