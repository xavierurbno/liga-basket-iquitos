"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SponsorCarouselLogo } from "@/components/sponsors/SponsorCarouselLogo";
import { SPONSOR_CAROUSEL_HEADER_LOGO_CLASS } from "@/components/sponsors/sponsorFebDisplay";
import { useIsClient } from "@/hooks/useIsClient";
import { reactListKey } from "@/lib/react/listKey";

export type SponsorCarouselItem = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
};

export type SponsorCarouselProps = {
  sponsors: SponsorCarouselItem[];
  /** Logo superior a color (federación o liga), estilo FEB. */
  headerLogoUrl?: string | null;
  headerLogoAlt?: string;
};

const AUTO_MS = 5000;
const CROSSFADE_MS = 0.5;

export function SponsorCarousel({
  sponsors,
  headerLogoUrl,
  headerLogoAlt = "Logo de la liga",
}: SponsorCarouselProps) {
  const isClient = useIsClient();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const count = sponsors.length;
  const current = count > 0 ? sponsors[index % count] : null;
  const currentSlideKey =
    current != null
      ? reactListKey(current.id, index % count, "sponsor-slide", current.logoUrl)
      : null;

  const paginate = useCallback(
    (dir: number) => {
      if (count <= 1) return;
      setDirection(dir);
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (!isClient || count <= 1) return;
    const t = setInterval(() => paginate(1), AUTO_MS);
    return () => clearInterval(t);
  }, [isClient, count, paginate]);

  const fadeTransition = reduceMotion
    ? { duration: 0.15 }
    : { duration: CROSSFADE_MS, ease: "easeInOut" as const };

  const fadeVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const headerSrc = headerLogoUrl?.trim() || null;

  return (
    <aside
      className="flex min-h-[180px] min-w-0 flex-col lg:h-full lg:min-h-0 lg:flex-1"
      aria-label="Socio patrocinador"
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
        {headerSrc ? (
          <div className="flex shrink-0 justify-center border-b border-white/10 px-3 pt-3 pb-2">
            <img
              src={headerSrc}
              alt={headerLogoAlt}
              className={SPONSOR_CAROUSEL_HEADER_LOGO_CLASS}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : null}

        <p className="pointer-events-none shrink-0 border-b border-white/10 py-2 text-center text-[9px] font-black uppercase tracking-[0.22em] text-white/80">
          Socio patrocinador
        </p>

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-3 pb-3 pt-2">
          {current ? (
            <>
              <div className="relative flex w-full max-w-[168px] flex-1 flex-col items-center justify-center">
                <div
                  className="pointer-events-none absolute inset-y-4 left-0 z-10 w-6 bg-linear-to-r from-black via-black/80 to-transparent sm:w-8"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-y-4 right-0 z-10 w-6 bg-linear-to-l from-black via-black/80 to-transparent sm:w-8"
                  aria-hidden
                />

                <div className="relative z-20 flex h-24 w-full items-center justify-center">
                  {isClient ? (
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                      <motion.div
                        key={currentSlideKey!}
                        custom={direction}
                        variants={fadeVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={fadeTransition}
                        className="absolute inset-0 flex items-center justify-center px-2"
                      >
                        <SponsorSlideBody sponsor={current} />
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <div className="flex w-full items-center justify-center">
                      <SponsorSlideBody sponsor={current} />
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex max-w-[168px] flex-col items-center text-center">
              <div className="flex h-20 w-full items-center justify-center border border-dashed border-white/15">
                <span className="text-[10px] font-medium uppercase tracking-wide text-white/40">
                  Espacio disponible
                </span>
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
        className="flex w-full flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
  return (
    <>
      <SponsorCarouselLogo name={name} logoUrl={logoUrl} />
      <span className="mt-2 line-clamp-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">
        {name}
      </span>
    </>
  );
}
