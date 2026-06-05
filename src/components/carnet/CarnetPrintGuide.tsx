export function CarnetPrintGuide() {
  return (
    <details className="rounded-2xl border border-slate-200 bg-slate-50/80 text-sm text-slate-700">
      <summary className="cursor-pointer px-4 py-3 font-bold text-slate-800">
        Guía de impresión del carnet (CR80 doble cara)
      </summary>
      <ol className="list-decimal space-y-2 px-4 pb-4 pl-8 text-xs font-medium leading-relaxed">
        <li>
          <strong>Emite el carnet</strong> en el sistema (paso 1). Queda registrada la versión y
          la fecha de emisión.
        </li>
        <li>
          <strong>Descarga el PDF</strong> (paso 2): página 1 = anverso, página 2 = reverso (85,6 ×
          53,98 mm, horizontal).
        </li>
        <li>
          <strong>EcoTank / impresora de oficina:</strong> tamaño <strong>CR80 / ID-1</strong>,
          escala 100 % (sin «ajustar a página»), doble cara con volteo en borde corto.
        </li>
        <li>
          <strong>Imprenta o PVC:</strong> entrega el PDF; pide prueba de color y lectura del QR
          antes del lote completo.
        </li>
        <li>
          <strong>Zebra PVC (futuro):</strong> plantilla PNG en{" "}
          <code className="rounded bg-white px-1">public/carnet/lddbi-template/</code>; calibración
          de coordenadas en Fase 7.
        </li>
        <li>
          El <strong>QR del reverso</strong> abre{" "}
          <code className="rounded bg-white px-1">/validar/[token]</code> — el mismo enlace que mesa
          de control y el que puedes compartir al padre (paso 3).
        </li>
        <li>
          Si actualizas foto o datos, usa <strong>Re-emitir carnet</strong> para incrementar la
          versión antes de imprimir de nuevo.
        </li>
      </ol>
    </details>
  );
}
