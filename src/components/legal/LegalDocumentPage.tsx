import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LegalMarkdown } from "@/components/legal/LegalMarkdown";
import { loadLegalDocumentMarkdown } from "@/lib/legal/load-legal-document";
import {
  getLegalDocumentMeta,
  LEGAL_DOCUMENTS,
  type LegalDocumentId,
} from "@/lib/legal/legal-documents";
import { getPlatformDefaultLeagueSlug, getPlatformName } from "@/lib/platform/platform-config";

type LegalDocumentPageProps = {
  documentId: LegalDocumentId;
};

export async function LegalDocumentPage({ documentId }: LegalDocumentPageProps) {
  const meta = getLegalDocumentMeta(documentId);
  const markdown = await loadLegalDocumentMarkdown(documentId);
  const platformName = getPlatformName();
  const defaultSlug = getPlatformDefaultLeagueSlug();
  const backHref = defaultSlug ? `/l/${defaultSlug}/` : "/";

  const related = Object.values(LEGAL_DOCUMENTS).filter((doc) => doc.id !== documentId);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-300">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-500/40 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(67,56,202,0.14),transparent_50%)]"
        aria-hidden
      />

      <header className="relative border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al portal
          </Link>
          <span className="hidden items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-300/80 sm:inline-flex">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            {platformName}
          </span>
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <LegalMarkdown content={markdown} />

        <aside className="mt-14 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">
            Documentos relacionados
          </h2>
          <ul className="mt-4 space-y-2">
            {related.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={doc.pathname}
                  className="text-sm font-medium text-[#7eb4ff] transition hover:text-white"
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}
