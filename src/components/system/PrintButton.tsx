"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white"
    >
      Imprimir
    </button>
  );
}
