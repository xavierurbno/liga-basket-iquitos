"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadPhotosAction } from "@/lib/actions/gallery";
import type { Club } from "@/lib/db/schema";
import { X, Plus, Camera, Loader2 } from "lucide-react";

interface AddPhotoButtonProps {
  clubs: Club[];
}

export function AddPhotoButton({ clubs }: AddPhotoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.8
          );
        };
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (selectedFiles.length === 0) {
      setError("Por favor selecciona al menos una imagen.");
      return;
    }

    const rawFormData = new FormData(e.currentTarget);
    const caption = rawFormData.get("caption") as string;
    const clubId = rawFormData.get("clubId") as string;

    startTransition(async () => {
      const formData = new FormData();
      
      // Comprimir en paralelo
      const optimizedFiles = await Promise.all(
        selectedFiles.map((file) => compressImage(file))
      );

      optimizedFiles.forEach((file) => {
        formData.append("files", file);
      });
      
      formData.append("caption", caption);
      formData.append("clubId", clubId || "General");

      const result = await uploadPhotosAction(formData);
      if (result.success) {
        setIsOpen(false);
        setPreviews([]);
        setSelectedFiles([]);
      } else {
        setError(result.error || "Error al subir las fotos.");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2 rounded-full bg-[#005CEE] px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-[#004FCC] hover:shadow-xl active:scale-95"
      >
        <Plus className="h-5 w-5 stroke-[3]" />
        <span>AGREGAR FOTOS</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPending && setIsOpen(false)}
              className="absolute inset-0 bg-[#0f2040]/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="p-6">
                <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-black tracking-tighter text-[#1e3a5f]">
                      MULTIMEDIA MASIVA
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Sube múltiples fotos de acción
                    </p>
                  </div>
                  <button 
                    disabled={isPending}
                    onClick={() => setIsOpen(false)} 
                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Grid de Previsualización */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <AnimatePresence>
                      {previews.map((preview, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100"
                        >
                          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Botón de Agregar más */}
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-[#005CEE] hover:bg-slate-100">
                      <Camera className="h-6 w-6 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Agregar</span>
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

                  {/* Configuración */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Descripción General
                      </label>
                      <input
                        type="text"
                        name="caption"
                        placeholder="Ej: Torneo Verano 2026"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium focus:border-[#005CEE] focus:outline-none focus:ring-4 focus:ring-[#005CEE]/10"
                        disabled={isPending}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Club / Categoría
                      </label>
                      <select
                        name="clubId"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium focus:border-[#005CEE] focus:outline-none focus:ring-4 focus:ring-[#005CEE]/10"
                        disabled={isPending}
                      >
                        <option value="General">Ninguno / General</option>
                        {clubs.map((club) => (
                          <option key={club.id} value={club.id}>
                            {club.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-500"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending || selectedFiles.length === 0}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#005CEE] py-4 font-black tracking-[0.2em] text-white shadow-lg transition-all hover:bg-[#004FCC] hover:shadow-xl disabled:opacity-30 disabled:grayscale"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>PROCESANDO {selectedFiles.length} FOTOS...</span>
                      </>
                    ) : (
                      <span>SUBIR {selectedFiles.length} IMÁGENES</span>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
