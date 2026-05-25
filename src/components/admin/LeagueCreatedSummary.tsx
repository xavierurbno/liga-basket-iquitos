"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, X } from "lucide-react";
import { leaguePortalPublicUrl } from "@/lib/portal/league-portal-paths";

export function LeagueCreatedSummary({
  leagueName,
  slug,
  adminAssigned,
}: {
  leagueName: string;
  slug: string;
  adminAssigned: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const publicUrl = leaguePortalPublicUrl(slug);

  if (dismissed) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <section className="relative rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-4 rounded-lg p-1 text-emerald-700 transition hover:bg-emerald-100"
        aria-label="Cerrar resumen"
      >
        <X className="h-4 w-4" />
      </button>
      <h2 className="pr-8 text-lg font-black text-emerald-950">Liga creada correctamente</h2>
      <p className="mt-1 text-sm font-medium text-emerald-900">
        <strong>{leagueName}</strong> · slug <code className="rounded bg-white/80 px-1 font-mono text-xs">{slug}</code>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2">
        <span className="max-w-[min(100%,320px)] truncate font-mono text-xs text-slate-700" title={publicUrl}>
          {publicUrl}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-emerald-800"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar enlace público"}
        </button>
      </div>

      <ul className="mt-4 space-y-2 text-sm font-medium text-emerald-900">
        <li className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          Portal:{" "}
          <Link href={`/l/${slug}/`} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            /l/{slug}/
          </Link>
        </li>
        <li className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          Panel operativo: usa «Administrar esta liga» para abrir <span className="font-mono">/liga/</span>
        </li>
        <li className="flex items-start gap-2">
          {adminAssigned ? (
            <>
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Administrador de liga asignado o invitado por correo.
            </>
          ) : (
            <>
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-emerald-400" />
              Añade un LEAGUE_ADMIN en el formulario de abajo o en el checklist.
            </>
          )}
        </li>
      </ul>
    </section>
  );
}
