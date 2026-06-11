import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { createLegalDocumentMetadata } from "@/lib/legal/legal-document-metadata";

export const metadata: Metadata = createLegalDocumentMetadata("privacidad");

export default function PrivacidadPage() {
  return <LegalDocumentPage documentId="privacidad" />;
}
