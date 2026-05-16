"use client";

import { useTransition } from "react";
import { FileText } from "lucide-react";
import { getPublicNormativaDownloadUrl } from "@/lib/actions/normativas-documents";

export function NormativaDownloadButton({
  documentId,
  label = "Descargar",
}: {
  documentId: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await getPublicNormativaDownloadUrl(documentId);
          if (res.ok) {
            window.open(res.url, "_blank", "noopener,noreferrer");
          }
        })
      }
      className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#163056] disabled:opacity-60"
    >
      <FileText className="h-4 w-4 shrink-0" aria-hidden />
      {pending ? "Abriendo…" : label}
    </button>
  );
}
