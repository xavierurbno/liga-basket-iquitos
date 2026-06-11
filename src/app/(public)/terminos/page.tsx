import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { createLegalDocumentMetadata } from "@/lib/legal/legal-document-metadata";

export const metadata: Metadata = createLegalDocumentMetadata("terminos");

export default function TerminosPage() {
  return <LegalDocumentPage documentId="terminos" />;
}
