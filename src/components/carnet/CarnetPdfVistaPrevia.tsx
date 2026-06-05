"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { generateCarnetPdfBlob } from "@/lib/carnet/generateCarnetPdfBlob";
import { mapVistaPreviaToGenerateCarnetPdfProps } from "@/lib/carnet/mapVistaPreviaToGenerateCarnetPdfProps";
import { LDDBI_TEMPLATE_ASPECT_CSS } from "@/lib/carnet/lddbiTemplateLayout";
import { CARNET_THEME_PRESET_LABELS, parseCarnetThemePreset } from "@/lib/carnet/carnetTheme";
import { isCarnetValidacionMode } from "@/lib/carnet/isCarnetValidacionMode";
import type { CarnetVistaPreviaProps } from "@/lib/types/carnet";

function buildPreviewCacheKey(props: CarnetVistaPreviaProps): string {
  return JSON.stringify({
    playerId: props.playerId,
    leagueId: props.leagueId,
    name: props.name,
    lastname: props.lastname,
    documentNumber: props.documentNumber,
    fechaNacimientoIso: props.fechaNacimientoIso,
    gender: props.gender,
    clubName: props.clubName,
    categoriaDetalle: props.categoriaDetalle ?? props.categoriaNombre,
    carnetNumberDisplay: props.carnetNumberDisplay,
    photoUrl: props.photoUrl,
    carnetThemePreset: props.carnetThemePreset,
    vigenciaLabel: props.vigenciaLabel,
    authorizationText: props.authorizationText,
    presidentDisplayName: props.presidentDisplayName,
    secretaryDisplayName: props.secretaryDisplayName,
  });
}

export function CarnetPdfVistaPrevia(props: CarnetVistaPreviaProps) {
  const esValidacion = isCarnetValidacionMode(props);
  const [caraAdmin, setCaraAdmin] = useState<"anverso" | "reverso">("anverso");
  const cara = esValidacion ? "anverso" : caraAdmin;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cacheKey = useMemo(() => buildPreviewCacheKey(props), [props]);

  const generateProps = useMemo(
    () =>
      mapVistaPreviaToGenerateCarnetPdfProps(props, {
        leagueId: props.leagueId,
        fechaNacimientoIso: props.fechaNacimientoIso,
        documentType: props.documentType,
        categoriaDetalle: props.categoriaDetalle,
        clubLogoUrl: props.clubLogoUrl,
      }),
    [cacheKey],
  );

  const preset = parseCarnetThemePreset(props.carnetThemePreset);
  const presetLabel = CARNET_THEME_PRESET_LABELS[preset];

  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      setPdfBlob(null);
      try {
        const blob = await generateCarnetPdfBlob(generateProps);
        if (cancelled) return;
        setPdfBlob(blob);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "No se pudo generar la vista previa del PDF.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPdf();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, generateProps]);

  useEffect(() => {
    const blob: Blob | null = pdfBlob;
    const canvasEl = canvasRef.current;
    if (!blob || !canvasEl) return;
    const blobReady: Blob = blob;
    const canvasReady: HTMLCanvasElement = canvasEl;

    let cancelled = false;
    const pageIndex = cara === "anverso" ? 1 : 2;

    const renderPage = async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const data = await blobReady.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data }).promise;
      if (cancelled) return;

      const page = await pdf.getPage(pageIndex);
      if (cancelled) return;

      const baseViewport = page.getViewport({ scale: 1 });
      const parent = canvasReady.parentElement;
      const maxW = parent?.clientWidth ?? 520;
      const scale = maxW / baseViewport.width;
      const viewport = page.getViewport({ scale });

      const ctx = canvasReady.getContext("2d");
      if (!ctx) return;

      canvasReady.width = Math.floor(viewport.width);
      canvasReady.height = Math.floor(viewport.height);

      const renderTask = page.render({ canvasContext: ctx, viewport });
      await renderTask.promise;
    };

    void renderPage().catch((e) => {
      if (!cancelled) {
        setError(
          e instanceof Error ? e.message : "No se pudo mostrar el PDF en pantalla.",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pdfBlob, cara]);

  const canvasBlock = (
      <div className="mx-auto w-full max-w-[520px] rounded-xl border border-slate-200 bg-slate-100 p-2 shadow-lg">
        <div
          className="relative flex min-h-[200px] w-full items-center justify-center overflow-hidden rounded-lg bg-white"
          style={{ aspectRatio: LDDBI_TEMPLATE_ASPECT_CSS }}
        >
          {loading ? (
            <p className="text-xs text-slate-500">Generando vista previa del PDF…</p>
          ) : error ? (
            <p className="max-w-[90%] text-center text-xs text-red-700">{error}</p>
          ) : (
            <canvas ref={canvasRef} className="block h-full w-full" />
          )}
        </div>
      </div>
  );

  if (esValidacion) {
    return (
      <section className="flex justify-center" aria-label="Credencial deportiva">
        {canvasBlock}
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Vista previa carnet PDF">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Vista previa del carnet</h2>
          <p className="text-[11px] text-slate-500">
            Preset: <strong>{presetLabel}</strong> — misma salida que el PDF descargable
            (WYSIWYG).
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCaraAdmin("anverso")}
            className={`rounded-md px-3 py-1.5 ${
              cara === "anverso" ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-600"
            }`}
          >
            Anverso
          </button>
          <button
            type="button"
            onClick={() => setCaraAdmin("reverso")}
            className={`rounded-md px-3 py-1.5 ${
              cara === "reverso" ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-600"
            }`}
          >
            Reverso
          </button>
        </div>
      </div>

      {canvasBlock}

      <p className="text-center text-[10px] leading-snug text-slate-500">
        Lo que ves es el PDF real generado en el navegador; al descargar obtendrás el mismo
        archivo.
      </p>
    </section>
  );
}
