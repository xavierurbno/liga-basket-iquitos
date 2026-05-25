import { FileText } from "lucide-react";
import type { Normativa } from "@/lib/db/schema";
import { NormativasMigrationHint } from "@/components/normativas/NormativasMigrationHint";

export type NormativasLoadResult =
  | { kind: "list"; docs: Normativa[] }
  | { kind: "migration" }
  | { kind: "error"; message: string };

export function NormativasPublicSection({ data }: { data: NormativasLoadResult }) {
  if (data.kind === "migration") {
    return (
      <div className="mt-8">
        <NormativasMigrationHint />
      </div>
    );
  }

  if (data.kind === "error") {
    return (
      <div
        role="alert"
        className="mt-10 rounded-sm border border-red-200 bg-red-50 px-6 py-8 text-sm text-red-950"
      >
        <p className="font-semibold">No se pudo mostrar el listado</p>
        <p className="mt-2 leading-relaxed">{data.message}</p>
      </div>
    );
  }

  if (data.docs.length === 0) {
    return (
      <p className="mt-10 rounded-sm border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
        No hay documentos públicos en este momento.
      </p>
    );
  }

  return (
    <ul className="mt-8 divide-y divide-slate-200 rounded-sm border border-slate-200 bg-white shadow-sm">
      {data.docs.map((doc) => (
        <li key={doc.id}>
          <a
            href={doc.urlArchivo}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 px-4 py-4 transition hover:bg-slate-50 sm:px-5 sm:py-4"
          >
            <span
              className="inline-flex shrink-0 items-center justify-center rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase leading-none tracking-wide text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:text-[10px]"
              aria-hidden
            >
              PDF
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <FileText
                className="hidden h-4 w-4 shrink-0 text-[#005CEE] opacity-70 sm:block"
                aria-hidden
              />
              <span className="min-w-0 text-[15px] font-semibold leading-snug text-[#005CEE] decoration-transparent underline-offset-2 group-hover:underline sm:text-base">
                {doc.titulo}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
