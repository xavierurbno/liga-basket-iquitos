"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { getInstitutionalLogosAction } from "@/lib/actions/assets";
import { getTournamentExportData } from "@/lib/actions/tournaments";
import { escalarLogoParaPdf } from "@/lib/pdf/imagenImpresion";
import { downloadTournamentFixturePdf } from "@/lib/pdf/tournamentFixturePdf";

export function TournamentExportPdfButton({ tournamentId }: { tournamentId: string }) {
  const [loading, setLoading] = useState(false);

  const onExport = async () => {
    setLoading(true);
    const res = await getTournamentExportData(tournamentId);
    if (!res.success) {
      setLoading(false);
      toast.error(res.error);
      return;
    }

    try {
      const logosRes = await getInstitutionalLogosAction();
      const [fedUrl, ligaUrl] = await Promise.all([
        logosRes.success && logosRes.federacionBase64
          ? escalarLogoParaPdf(logosRes.federacionBase64)
          : null,
        logosRes.success && logosRes.ligaBase64
          ? escalarLogoParaPdf(logosRes.ligaBase64, 2800)
          : null,
      ]);

      downloadTournamentFixturePdf(res.data, {
        federacionLogoPngDataUrl: fedUrl,
        ligaLogoPngDataUrl: ligaUrl,
      });
      toast.success("PDF descargado");
    } catch {
      toast.error("No se pudo generar el PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onExport}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      <FileDown className="h-4 w-4" />
      {loading ? "Generando…" : "Descargar fixture (PDF)"}
    </button>
  );
}
