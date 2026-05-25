"use client";

import { useState } from "react";
import { generateCarnetPdfBlob } from "@/lib/carnet/generateCarnetPdfBlob";
import type { GenerateCarnetPDFProps } from "@/lib/types/carnet";

export function GenerateCarnetPDF({
  label = "Carnet",
  className = "rounded-lg border border-[#BFDBFE] bg-white px-2.5 py-1 text-xs font-semibold text-[#1D4ED8] hover:bg-blue-50 disabled:opacity-60",
  ...props
}: GenerateCarnetPDFProps) {
  const [cargando, setCargando] = useState(false);

  async function generar() {
    setCargando(true);
    try {
      const blob = await generateCarnetPdfBlob(props);
      const enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(blob);
      enlace.download = `${props.fileName.replace(/\.pdf$/i, "")}.pdf`;
      enlace.click();
      URL.revokeObjectURL(enlace.href);
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void generar();
      }}
      disabled={cargando}
      className={className}
    >
      {cargando ? "…" : label}
    </button>
  );
}
