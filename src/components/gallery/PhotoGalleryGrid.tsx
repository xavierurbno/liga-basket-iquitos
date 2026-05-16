"use client";

import { useState, useEffect, useCallback, useOptimistic, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ImageOff, Trash2, Loader2 } from "lucide-react";
import { deletePhotoAction } from "@/lib/actions/gallery";

export interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string | null;
  alt?: string;
}

interface PhotoGalleryGridProps {
  photos: GalleryPhoto[];
  emptyMessage?: string;
  emptySubMessage?: string;
  columns?: "4" | "5" | "6";
  canDelete?: boolean; // Nueva prop para permisos
}

/**
 * PhotoGalleryGrid — Client Component
 *
 * Grid clicable con lightbox integrado y eliminación optimista (React 19).
 */
export function PhotoGalleryGrid({
  photos,
  emptyMessage = "Aún no hay fotos.",
  emptySubMessage = "Usa el formulario de arriba para subir las primeras imágenes.",
  columns = "5",
  canDelete = false,
}: PhotoGalleryGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // Gestión optimista de la lista de fotos
  const [optimisticPhotos, removeOptimisticPhoto] = useOptimistic(
    photos,
    (state, photoId: string) => state.filter((p) => p.id !== photoId)
  );

  const isOpen = activeIndex !== null;
  const activePhoto = activeIndex !== null ? optimisticPhotos[activeIndex] : null;

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i + 1) % optimisticPhotos.length));
  }, [optimisticPhotos.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) =>
      i === null ? null : (i - 1 + optimisticPhotos.length) % optimisticPhotos.length
    );
  }, [optimisticPhotos.length]);

  const close = useCallback(() => setActiveIndex(null), []);

  // Manejador de eliminación
  const handleDelete = async (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation(); // Evitar abrir el lightbox
    
    if (!confirm("¿Estás seguro de que deseas eliminar esta foto permanentemente?")) return;

    startTransition(async () => {
      // 1. UI instantánea
      removeOptimisticPhoto(photoId);
      
      // 2. Acción de servidor
      const result = await deletePhotoAction(photoId);
      
      if (!result.success) {
        alert(result.error || "Error al eliminar la foto.");
      }
    });
  };

  // Teclado
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close, goNext, goPrev]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const colClass =
    columns === "6"
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
      : columns === "4"
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  if (optimisticPhotos.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50">
        <ImageOff className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-400">{emptyMessage}</p>
        {emptySubMessage && (
          <p className="text-xs text-slate-300">{emptySubMessage}</p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* ── Grid de Miniaturas ── */}
      <div className={`grid gap-3 ${colClass}`}>
        {optimisticPhotos.map((photo, idx) => (
          <div key={photo.id} className="group relative">
            <button
              type="button"
              onClick={() => setActiveIndex(idx)}
              className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005CEE]"
              aria-label={`Ampliar foto ${idx + 1}`}
            >
              <Image
                src={photo.url}
                alt={photo.alt ?? photo.caption ?? `Foto ${idx + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/25">
                <ZoomIn className="h-7 w-7 text-white opacity-0 drop-shadow-lg transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </button>

            {/* Botón Eliminar (Solo si canDelete es true) */}
            {canDelete && (
              <button
                type="button"
                onClick={(e) => handleDelete(e, photo.id)}
                disabled={isPending}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/90 text-white opacity-0 shadow-lg backdrop-blur-sm transition-all hover:bg-red-600 hover:scale-110 group-hover:opacity-100 disabled:bg-slate-400"
                title="Eliminar foto"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Caption reveal */}
            {photo.caption && (
              <div className="absolute inset-x-0 bottom-0 pointer-events-none translate-y-full bg-gradient-to-t from-black/80 to-transparent px-3 py-3 transition-transform duration-300 group-hover:translate-y-0">
                <p className="line-clamp-2 text-[11px] font-medium text-white/90">
                  {photo.caption}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Lightbox Modal ── */}
      <AnimatePresence>
        {isOpen && activePhoto && (
          <motion.div
            key="lightbox-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-xl"
            onClick={close}
          >
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto.url}
                alt={activePhoto.alt ?? activePhoto.caption ?? "Foto LDDBI"}
                className="max-h-[88vh] max-w-[88vw] rounded-xl object-contain shadow-2xl"
                draggable={false}
              />

              {activePhoto.caption && (
                <div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-black/70 to-transparent px-6 py-4">
                  <p className="text-center text-sm font-medium text-white/90">
                    {activePhoto.caption}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Navegación y Cierre */}
            {optimisticPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/25 md:left-8"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/25 md:right-8"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); close(); }}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/25 md:right-6 md:top-6"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
