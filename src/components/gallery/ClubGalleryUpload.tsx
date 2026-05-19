"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Loader2, CheckCircle2, Upload } from "lucide-react";
import { uploadClubPhotosAction } from "@/lib/actions/clubs";
import {
  GALLERY_MAX_RECOMMENDED,
  GALLERY_UPLOAD_BATCH_SIZE,
  uploadGalleryFilesInBatches,
} from "@/lib/gallery/client-upload";
import { useRouter } from "next/navigation";

interface ClubGalleryUploadProps {
  clubId: string;
  clubName: string;
}

export function ClubGalleryUpload({ clubId, clubName }: ClubGalleryUploadProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(
    null,
  );

  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const nextCount = selectedFiles.length + files.length;
    if (nextCount > GALLERY_MAX_RECOMMENDED) {
      setError(`Máximo ${GALLERY_MAX_RECOMMENDED} fotos por envío. Tienes ${nextCount} seleccionadas.`);
      e.target.value = "";
      return;
    }

    setError(null);
    setSelectedFiles((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    const url = previews[idx];
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearSelection = () => {
    previews.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });
    setPreviews([]);
    setSelectedFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (selectedFiles.length === 0) {
      setError("Selecciona al menos una imagen.");
      return;
    }

    const rawFormData = new FormData(e.currentTarget);
    const caption = rawFormData.get("caption") as string;

    startTransition(async () => {
      setUploadProgress({ done: 0, total });

      const result = await uploadGalleryFilesInBatches(
        selectedFiles,
        (batch) => {
          const formData = new FormData();
          batch.forEach((f) => formData.append("files", f));
          formData.append("caption", caption ?? "");
          formData.append("clubId", clubId);
          return formData;
        },
        uploadClubPhotosAction,
        (done, t) => setUploadProgress({ done, total: t }),
      );

      if (!result.success) {
        setUploadProgress(null);
        setError(result.error ?? "Error al subir las fotos.");
        if (result.uploaded > 0) router.refresh();
        return;
      }

      setUploadProgress(null);
      setSuccess(true);
      clearSelection();
      router.refresh();
      setTimeout(() => setSuccess(false), 4000);
    });
  };

  const progressPct =
    uploadProgress && uploadProgress.total > 0
      ? Math.round((uploadProgress.done / uploadProgress.total) * 100)
      : 0;

  const batchCount =
    selectedFiles.length > 0
      ? Math.ceil(selectedFiles.length / GALLERY_UPLOAD_BATCH_SIZE)
      : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <motion.div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-slate-600">
        Las fotos de <span className="font-semibold">{clubName}</span> se comprimen y suben en lotes de{" "}
        {GALLERY_UPLOAD_BATCH_SIZE}. Puedes seleccionar muchas a la vez; no cierres la pestaña hasta
        ver el mensaje de éxito.
      </motion.div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <AnimatePresence>
          {previews.map((src, idx) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                aria-label="Quitar imagen"
                disabled={isPending}
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-[#005CEE] hover:bg-blue-50/50">
          <Camera className="h-5 w-5 text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Agregar</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isPending}
          />
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <p className="text-xs font-medium text-slate-500">
          {selectedFiles.length} foto{selectedFiles.length !== 1 ? "s" : ""} seleccionada
          {selectedFiles.length !== 1 ? "s" : ""} · {batchCount} lote{batchCount !== 1 ? "s" : ""}
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
          Descripción / Caption
        </label>
        <input
          type="text"
          name="caption"
          placeholder={`Ej: Entrenamiento ${clubName} – Mayo 2026`}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-300 transition-all focus:border-[#005CEE] focus:outline-none focus:ring-4 focus:ring-[#005CEE]/10"
          disabled={isPending}
        />
        <p className="mt-1 text-[10px] text-slate-400">
          El caption se aplica a todas las fotos de esta subida.
        </p>
      </div>

      <AnimatePresence>
        {uploadProgress && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2 rounded-xl bg-slate-50 px-4 py-3"
          >
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Subiendo fotos…</span>
              <span>
                {uploadProgress.done} / {uploadProgress.total} ({progressPct}%)
              </span>
            </div>
            <motion.div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#005CEE] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600"
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            key="success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-600"
          >
            <CheckCircle2 className="h-4 w-4" />
            ¡Fotos subidas con éxito!
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={isPending || selectedFiles.length === 0}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#005CEE] py-3.5 text-sm font-black tracking-[0.15em] text-white shadow-md transition-all hover:bg-[#004FCC] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:grayscale active:scale-[0.98]"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              SUBIENDO{" "}
              {uploadProgress
                ? `${uploadProgress.done}/${uploadProgress.total}`
                : selectedFiles.length}{" "}
              FOTOS…
            </span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            <span>SUBIR {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ""}FOTOS</span>
          </>
        )}
      </button>
    </form>
  );
}
