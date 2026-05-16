"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Loader2, CheckCircle2, Upload } from "lucide-react";
import { uploadClubPhotosAction } from "@/lib/actions/clubs";
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

  /** Compresión client-side antes del envío */
  const compressImage = (file: File): Promise<File> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const MAX = 1200;
          let { width, height } = img;
          if (width > height) {
            if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
          } else {
            if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }) : file),
            "image/jpeg",
            0.82
          );
        };
      };
    });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
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
      const formData = new FormData();

      // Comprimir en paralelo
      const optimized = await Promise.all(selectedFiles.map(compressImage));
      optimized.forEach((f) => formData.append("files", f));
      formData.append("caption", caption ?? "");
      formData.append("clubId", clubId); // ← siempre vinculado al club

      const result = await uploadClubPhotosAction(formData);

      if (result.success) {
        setSuccess(true);
        setPreviews([]);
        setSelectedFiles([]);
        // Refrescar la lista de fotos del server component
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error ?? "Error al subir las fotos.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Grid de previsualizaciones + botón de agregar */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <AnimatePresence>
          {previews.map((src, idx) => (
            <motion.div
              key={idx}
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
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Botón de agregar fotos */}
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

      {/* Campo de descripción */}
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

      {/* Mensajes de estado */}
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

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={isPending || selectedFiles.length === 0}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#005CEE] py-3.5 text-sm font-black tracking-[0.15em] text-white shadow-md transition-all hover:bg-[#004FCC] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-30 disabled:grayscale active:scale-[0.98]"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>SUBIENDO {selectedFiles.length} FOTO{selectedFiles.length !== 1 ? "S" : ""}...</span>
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
