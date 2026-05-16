"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClubAction } from "@/lib/actions/ownership";

export function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createClubAction(formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      router.refresh();
      router.push(`/${result.slug}`);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-[border-color,box-shadow] focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Nombre del Club
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ej. Club Deportivo Universitario"
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium text-slate-700">
            Siglas del Club (URL)
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            placeholder="Ej. cdu"
            className={inputClass}
          />
          <p className="text-xs text-slate-500">
            Esto se usará para el enlace de tu panel: /cdu
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="presidentDocumentType" className="text-sm font-medium text-slate-700">
              Tipo de Documento
            </label>
            <select
              id="presidentDocumentType"
              name="presidentDocumentType"
              required
              className={inputClass}
            >
              <option value="DNI">DNI</option>
              <option value="CE">CE</option>
              <option value="PASAPORTE">PASAPORTE</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="presidentDocumentNumber" className="text-sm font-medium text-slate-700">
              N° de Documento
            </label>
            <input
              id="presidentDocumentNumber"
              name="presidentDocumentNumber"
              type="text"
              required
              placeholder="Ej. 12345678"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="presidentName" className="text-sm font-medium text-slate-700">
            Nombre Completo del Presidente
          </label>
          <input
            id="presidentName"
            name="presidentName"
            type="text"
            required
            placeholder="Nombres y Apellidos"
            className={inputClass}
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#1e3a5f] py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? "Guardando…" : "Registrar Club y Continuar"}
        </button>
      </div>
    </form>
  );
}
