"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { leaguePortalPublicUrl } from "@/lib/portal/league-portal-paths";

export function CopyLeaguePublicLink({ slug, leagueName }: { slug: string; leagueName: string }) {
  const [copied, setCopied] = useState(false);
  const url = leaguePortalPublicUrl(slug);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback silencioso */
    }
  };

  return (
    <div
      id="league-public-link"
      className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
    >
      <span className="max-w-[min(100%,280px)] truncate font-mono text-xs text-slate-600" title={url}>
        {url}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#005CEE] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#004bb5]"
        aria-label={`Copiar enlace público de ${leagueName}`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Copiar enlace"}
      </button>
    </div>
  );
}
