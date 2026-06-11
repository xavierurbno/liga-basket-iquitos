import type { Metadata } from "next";
import { getLegalDocumentMeta, type LegalDocumentId } from "@/lib/legal/legal-documents";
import { getPlatformName } from "@/lib/platform/platform-config";

export function createLegalDocumentMetadata(id: LegalDocumentId): Metadata {
  const meta = getLegalDocumentMeta(id);
  const platformName = getPlatformName();

  return {
    title: meta.title,
    description: meta.description,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${meta.title} | ${platformName}`,
      description: meta.description,
      type: "article",
    },
    alternates: {
      canonical: meta.pathname,
    },
  };
}
