"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { createNormativaDocumentAction } from "@/lib/actions/normativas-admin";

export function NormativaUploadForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fileLabel, setFileLabel] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      toast.error("Pulsa «Elegir archivo PDF», selecciona un PDF y vuelve a intentar «Subir normativa».");
      return;
    }

    setPending(true);
    try {
      const res = await createNormativaDocumentAction(fd);
      if (res && "success" in res && res.success) {
        toast.success("Normativa publicada.");
        form.reset();
        setFileLabel(null);
        router.refresh();
      } else if (res && "success" in res && !res.success) {
        toast.error("error" in res ? res.error : "No se pudo subir el documento.");
      }
    } catch {
      toast.error("Error de red al subir el archivo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">Subir nueva normativa</h2>
      <p className="text-sm text-slate-600">
        Solo super administrador o administrador de liga. El archivo se guarda en el bucket de Supabase (por
        defecto <code className="rounded bg-slate-100 px-1">Nomativa</code> o{" "}
        <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_BUCKET_NORMATIVAS</code>) y el registro en la tabla{" "}
        <code className="rounded bg-slate-100 px-1">normativas</code> de Postgres; las marcadas como públicas
        aparecen en <code className="rounded bg-slate-100 px-1">/normativas</code>.
      </p>

      <div>
        <label htmlFor="nt-title" className="block text-xs font-semibold text-slate-600">
          Título
        </label>
        <input
          id="nt-title"
          name="title"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="nt-desc" className="block text-xs font-semibold text-slate-600">
          Descripción (opcional)
        </label>
        <textarea
          id="nt-desc"
          name="description"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="nt-cat" className="block text-xs font-semibold text-slate-600">
          Categoría
        </label>
        <select
          id="nt-cat"
          name="category"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          defaultValue="REGLAMENTO"
        >
          <option value="REGLAMENTO">Reglamento</option>
          <option value="BASES">Bases</option>
          <option value="COMUNICADO">Comunicado</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="nt-public"
          name="isPublic"
          value="true"
          defaultChecked
          className="rounded border-slate-300"
        />
        <label htmlFor="nt-public" className="text-sm text-slate-700">
          Visible en la página pública
        </label>
      </div>

      <div>
        <span className="block text-xs font-semibold text-slate-600">Archivo (PDF)</span>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label
            htmlFor="nt-file"
            className="inline-flex w-fit cursor-pointer items-center justify-center rounded-lg border border-[#1e3a5f] bg-white px-4 py-2.5 text-sm font-semibold text-[#1e3a5f] shadow-sm transition hover:bg-slate-50"
          >
            Elegir archivo PDF
          </label>
          <input
            id="nt-file"
            name="file"
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              setFileLabel(f ? f.name : null);
            }}
          />
          <span className="min-w-0 truncate text-sm text-slate-600" aria-live="polite">
            {fileLabel ? (
              <>
                <span className="font-medium text-slate-900">{fileLabel}</span>
                <span className="text-slate-500"> — listo para enviar</span>
              </>
            ) : (
              <span className="text-slate-500">Aún no hay archivo seleccionado</span>
            )}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Usa el botón «Elegir archivo PDF» (no hace falta pulsar el texto gris del navegador). Luego pulsa «Subir
          normativa».
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#163056] disabled:opacity-60"
      >
        <Upload className="h-4 w-4 shrink-0" aria-hidden />
        {pending ? "Subiendo…" : "Subir normativa"}
      </button>
    </form>
  );
}
