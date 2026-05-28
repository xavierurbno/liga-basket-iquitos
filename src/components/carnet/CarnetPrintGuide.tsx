export function CarnetPrintGuide() {
  return (
    <details className="rounded-2xl border border-slate-200 bg-slate-50/80 text-sm text-slate-700">
      <summary className="cursor-pointer px-4 py-3 font-bold text-slate-800">
        Cómo imprimir el carnet (CR80 doble cara)
      </summary>
      <ol className="list-decimal space-y-2 px-4 pb-4 pl-8 text-xs font-medium leading-relaxed">
        <li>
          Descarga el PDF: contiene <strong>página 1 = anverso</strong> y{" "}
          <strong>página 2 = reverso</strong> (85,6 × 53,98 mm, horizontal).
        </li>
        <li>
          En la impresora o imprenta, elige tamaño <strong>CR80 / ID-1</strong> o escala 100 %
          (sin «ajustar a página»).
        </li>
        <li>
          Activa <strong>impresión a doble cara</strong>: volteo en borde corto (tipo tarjeta).
        </li>
        <li>
          Usa papel o PVC carnet; revisa que el QR del reverso lea bien antes de entregar.
        </li>
        <li>
          El código QR abre <code className="rounded bg-white px-1">/validar/[token]</code> para mesa
          de control.
        </li>
      </ol>
    </details>
  );
}
