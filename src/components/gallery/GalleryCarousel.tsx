"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SyntheticEvent } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";
import { reactListKey } from "@/lib/react/listKey";

type FebOrientation = "portrait" | "landscape";

/** Solo fotos claramente apaisadas usan cover; el resto usa contain (menos recortes en rostros / casi cuadradas). */
const FEB_FIT_CACHE_KEY = "feb-fit:v2";

function classifyFebOrientation(naturalWidth: number, naturalHeight: number): FebOrientation {
  if (naturalWidth <= 0 || naturalHeight <= 0) return "portrait";
  return naturalWidth > naturalHeight * 1.25 ? "landscape" : "portrait";
}

interface Photo {
  id: string;
  url: string;
  caption?: string | null;
}

interface GalleryCarouselProps {
  photos: Photo[];
  autoPlayInterval?: number;
  fullBleed?: boolean;
  visualVariant?: "default" | "feb";
}

/**
 * GalleryCarousel — hero de fotos (portal y otras vistas).
 * Variante `feb`: fondo cover+blur; primer plano `contain` o `cover` según orientación.
 */
export function GalleryCarousel({
  photos,
  autoPlayInterval = 5000,
  fullBleed = false,
  visualVariant = "default",
}: GalleryCarouselProps) {
  const isClient = useIsClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const febOrientationCache = useRef<Map<string, FebOrientation>>(new Map());
  const [febOrientation, setFebOrientation] = useState<FebOrientation | null>(null);
  const [febImgReady, setFebImgReady] = useState(false);
  const isFeb = visualVariant === "feb";

  const paginate = useCallback(
    (newDirection: number) => {
      setDirection(newDirection);
      setCurrentIndex((prev) => (prev + newDirection + photos.length) % photos.length);
    },
    [photos.length]
  );

  useEffect(() => {
    if (!isClient || isPaused || photos.length <= 1) return;
    timerRef.current = setInterval(() => paginate(1), autoPlayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isClient, isPaused, photos.length, autoPlayInterval, paginate]);

  const len = photos.length;
  const currentPhoto = len > 0 ? photos[currentIndex % len] : undefined;

  useEffect(() => {
    if (!isFeb || !currentPhoto) return;
    const cacheKey = `${FEB_FIT_CACHE_KEY}:${currentPhoto.id}`;
    const cached = febOrientationCache.current.get(cacheKey);
    if (cached) {
      setFebOrientation(cached);
      setFebImgReady(true);
    } else {
      setFebOrientation(null);
      setFebImgReady(false);
    }
  }, [isFeb, currentPhoto?.id]);

  const onFebForegroundLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      if (!currentPhoto) return;
      const el = e.currentTarget;
      const w = el.naturalWidth;
      const h = el.naturalHeight;
      if (w > 0 && h > 0) {
        const next = classifyFebOrientation(w, h);
        febOrientationCache.current.set(`${FEB_FIT_CACHE_KEY}:${currentPhoto.id}`, next);
        setFebOrientation(next);
      }
      setFebImgReady(true);
    },
    [currentPhoto]
  );

  if (len === 0 || !currentPhoto) return null;

  const slideKey = reactListKey(
    currentPhoto.id,
    currentIndex % len,
    "gallery-slide",
    currentPhoto.url,
  );

  const fallbackCaption = "Acción de la jornada — LDDBI";
  const shellClass = isFeb
    ? "group relative w-full overflow-hidden rounded-sm border border-slate-300/90 bg-slate-950 shadow-sm"
    : fullBleed
      ? "group relative w-full overflow-hidden border-y border-white/10 bg-slate-950 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)]"
      : "group relative w-full overflow-hidden rounded-3xl border border-white/5 bg-slate-950 shadow-2xl";
  const frameClass = isFeb
    ? "relative h-[280px] w-full min-w-0 max-w-full shrink-0 overflow-hidden bg-slate-950 sm:h-[320px] lg:h-[380px]"
    : "relative aspect-[21/9] w-full min-h-[400px] overflow-hidden bg-slate-950 md:min-h-[500px]";
  const imageSizes = isFeb
    ? "(max-width: 1024px) 90vw, min(920px, 72vw)"
    : "(max-width: 1280px) 100vw, 1280px";

  const slideContent = (
    <>
      <div className="absolute inset-0 overflow-hidden">
        {isFeb ? (
          <img
            src={currentPhoto.url}
            alt=""
            className="h-full w-full scale-110 object-cover opacity-50 blur-2xl"
            aria-hidden={true}
            decoding="async"
          />
        ) : (
          <Image
            src={currentPhoto.url}
            alt=""
            fill
            priority={currentIndex === 0}
            className="scale-110 object-cover opacity-40 blur-2xl"
            sizes={imageSizes}
            aria-hidden="true"
          />
        )}
      </div>

      {isFeb ? (
        <div className="absolute inset-0 z-10 pt-9 pb-17 sm:pt-10 sm:pb-20">
          <div className="relative mx-auto h-full w-full min-h-0 max-w-full px-1.5 sm:px-3">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption || fallbackCaption}
              onLoad={onFebForegroundLoad}
              loading={currentIndex === 0 ? "eager" : "lazy"}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-center transition-opacity duration-300 ${
                febOrientation === "landscape" ? "object-cover" : "object-contain"
              } ${febImgReady ? "opacity-100" : "opacity-0"}`}
            />
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <div className="relative h-full min-h-0 w-full">
            <Image
              src={currentPhoto.url}
              alt={currentPhoto.caption || fallbackCaption}
              fill
              priority={currentIndex === 0}
              className="object-contain p-4 md:p-8"
              sizes={imageSizes}
            />
          </div>
        </div>
      )}

      {!isFeb && (
        <>
          <div className="absolute inset-x-0 bottom-0 z-20 h-1/3 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
          {currentPhoto.caption && (
            <div className="absolute bottom-0 left-0 right-0 z-30 p-8 md:p-12">
              {isClient ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="max-w-3xl"
                >
                  <h3 className="text-lg font-bold leading-tight text-white drop-shadow-md md:text-3xl">
                    {currentPhoto.caption}
                  </h3>
                </motion.div>
              ) : (
                <h3 className="max-w-3xl text-lg font-bold leading-tight text-white drop-shadow-md md:text-3xl">
                  {currentPhoto.caption}
                </h3>
              )}
            </div>
          )}
        </>
      )}

      {isFeb && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-linear-to-t from-black/75 to-transparent sm:h-24" />
      )}
    </>
  );

  return (
    <div
      className={shellClass}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={frameClass}>
        {isClient ? (
          <AnimatePresence initial={false} custom={direction} mode="sync">
            <motion.div
              key={slideKey}
              custom={direction}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {slideContent}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0">{slideContent}</div>
        )}

        {isFeb && (
          <div className="absolute inset-x-0 bottom-0 z-30 flex min-h-12 items-center border-t border-white/10 bg-black/55 px-3 py-2 backdrop-blur-[2px] sm:min-h-13 sm:px-4">
            <p className="line-clamp-2 text-xs font-semibold leading-snug text-white sm:text-sm">
              {currentPhoto.caption?.trim() || fallbackCaption}
            </p>
          </div>
        )}

        <div
          className={`absolute inset-y-0 left-0 z-40 flex items-center pl-1 sm:pl-2 ${
            isFeb ? "opacity-100" : "opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          }`}
        >
          <button
            type="button"
            onClick={() => paginate(-1)}
            className={
              isFeb
                ? "flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/40 active:scale-95 sm:h-11 sm:w-11"
                : "flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-black active:scale-90"
            }
            aria-label="Foto anterior"
          >
            <ChevronLeft className={isFeb ? "h-6 w-6 stroke-2" : "h-6 w-6 stroke-[1.5]"} />
          </button>
        </div>
        <div
          className={`absolute inset-y-0 right-0 z-40 flex items-center pr-1 sm:pr-2 ${
            isFeb ? "opacity-100" : "opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          }`}
        >
          <button
            type="button"
            onClick={() => paginate(1)}
            className={
              isFeb
                ? "flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-white shadow-sm backdrop-blur-sm transition hover:bg-white/40 active:scale-95 sm:h-11 sm:w-11"
                : "flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white hover:text-black active:scale-90"
            }
            aria-label="Foto siguiente"
          >
            <ChevronRight className={isFeb ? "h-6 w-6 stroke-2" : "h-6 w-6 stroke-[1.5]"} />
          </button>
        </div>

        {isFeb ? (
          <div
            className="absolute left-0 right-0 top-2 z-40 flex justify-center gap-2 sm:top-2.5"
            role="tablist"
            aria-label="Posición en el carrusel"
          >
            {photos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-2.5 w-2.5 rounded-full border-2 border-white transition-all ${
                  idx === currentIndex ? "bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)]" : "bg-transparent hover:bg-white/40"
                }`}
                aria-label={`Ir a la diapositiva ${idx + 1}`}
                aria-current={idx === currentIndex ? "true" : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="absolute bottom-6 right-8 z-10 flex items-center gap-1.5">
            {photos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentIndex ? "w-8 bg-white" : "w-2 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Ir a la diapositiva ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
