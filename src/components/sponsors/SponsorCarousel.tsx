"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";

export type SponsorCarouselItem = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
};

const ACCENT = "#005CEE";
const AUTO_MS = 5000;

export function SponsorCarousel({ sponsors }: { sponsors: SponsorCarouselItem[] }) {
  const isClient = useIsClient();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const count = sponsors.length;
  const current = count > 0 ? sponsors[index % count] : null;

  const paginate = useCallback(
    (dir: number) => {
      if (count <= 1) return;
      setDirection(dir);
      setIndex((i) => (i + dir + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (!isClient || count <= 1) return;
    const t = setInterval(() => paginate(1), AUTO_MS);
    return () => clearInterval(t);
  }, [isClient, count, paginate]);

  const slideTransition = reduceMotion
    ? { duration: 0.15 }
    : { type: "tween" as const, ease: "easeInOut" as const, duration: 0.38 };

  const slideVariants = reduceMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (dir: number) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir < 0 ? 28 : -28, opacity: 0 }),
      };

  return (
    <aside
      className="flex min-h-[180px] min-w-0 flex-col lg:h-full lg:min-h-0 lg:flex-1"
      aria-label="Socio patrocinador"
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-white/15 bg-zinc-950 shadow-sm">
        <p className="pointer-events-none shrink-0 pt-2 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-[#005CEE]/90">
          Socio patrocinador
        </p>

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-3 pb-2 pt-1">
          {current ? (
            <>
              {isClient ? (
                <AnimatePresence initial={false} custom={direction} mode="sync">
                  <motion.div
                    key={current.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={slideTransition}
                    className="flex w-full max-w-[168px] flex-col items-center"
                  >
                    <SponsorSlideBody sponsor={current} />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex w-full max-w-[168px] flex-col items-center">
                  <SponsorSlideBody sponsor={current} />
                </div>
              )}

              {count > 1 && (
                <div className="mt-2 flex w-full shrink-0 items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => paginate(-1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-zinc-900 text-zinc-300 shadow-sm transition hover:border-[#005CEE]/50 hover:bg-zinc-800 hover:text-[#005CEE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CEE]"
                    aria-label="Patrocinador anterior"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>
                  <div className="flex gap-1.5" role="tablist" aria-label="Seleccionar patrocinador">
                    {sponsors.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        role="tab"
                        aria-selected={i === index}
                        onClick={() => {
                          setDirection(i > index ? 1 : -1);
                          setIndex(i);
                        }}
                        className="h-2 w-2 rounded-full transition"
                        style={{
                          backgroundColor: i === index ? ACCENT : "rgba(255,255,255,0.25)",
                        }}
                        aria-label={`Ver ${s.name}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => paginate(1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-zinc-900 text-zinc-300 shadow-sm transition hover:border-[#005CEE]/50 hover:bg-zinc-800 hover:text-[#005CEE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CEE]"
                    aria-label="Patrocinador siguiente"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex max-w-[168px] flex-col items-center text-center">
              <div className="flex h-20 w-full items-center justify-center rounded-md border border-dashed border-white/20 bg-black/40">
                <span className="text-[10px] font-medium text-white/45">Espacio disponible</span>
              </div>
              <p className="mt-2 text-[10px] leading-snug text-white/55">
                Próximamente anunciaremos a nuestros socios patrocinadores.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function SponsorSlideBody({ sponsor }: { sponsor: SponsorCarouselItem }) {
  if (sponsor.websiteUrl) {
    return (
      <Link
        href={sponsor.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full flex-col items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#005CEE] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        <SponsorLogoBlock name={sponsor.name} logoUrl={sponsor.logoUrl} />
      </Link>
    );
  }
  return (
    <div className="flex w-full flex-col items-center">
      <SponsorLogoBlock name={sponsor.name} logoUrl={sponsor.logoUrl} />
    </div>
  );
}

function SponsorLogoBlock({ name, logoUrl }: { name: string; logoUrl: string }) {
  // `<img>` evita bloqueos de `remotePatterns` (URLs firmadas, otro subdominio, SVG, etc.).
  // Misma estrategia que `SponsorFooter`.
  return (
    <>
      <div className="flex h-20 w-full items-center justify-center">
        <img
          src={logoUrl}
          alt={name}
          className="max-h-20 w-auto max-w-full object-contain object-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <span className="mt-2 line-clamp-2 text-center text-[10px] font-semibold uppercase tracking-wide text-white/90">
        {name}
      </span>
    </>
  );
}
