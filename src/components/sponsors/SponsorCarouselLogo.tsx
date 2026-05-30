"use client";

import { useCallback, useState } from "react";
import type { SyntheticEvent } from "react";
import { sponsorCarouselLogoClass } from "@/components/sponsors/sponsorFebDisplay";

type LogoOrientation = "portrait" | "landscape" | "square";

function classifyLogoOrientation(w: number, h: number): LogoOrientation {
  if (w <= 0 || h <= 0) return "portrait";
  const ratio = w / h;
  if (ratio > 1.2) return "landscape";
  if (ratio < 0.85) return "portrait";
  return "square";
}

/**
 * Logo del carrusel: respeta EXIF, detecta apaisado/retrato y evita que se vea «de costado»
 * en un slot vertical (object-contain + límites por orientación).
 */
export function SponsorCarouselLogo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string;
}) {
  const [orientation, setOrientation] = useState<LogoOrientation | null>(null);

  const onLoad = useCallback((e: SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    if (w > 0 && h > 0) setOrientation(classifyLogoOrientation(w, h));
  }, []);

  const sizeClass =
    orientation === "landscape"
      ? "max-h-[4.5rem] max-w-full w-full"
      : orientation === "square"
        ? "max-h-[4.75rem] max-w-[4.75rem]"
        : "max-h-[5.5rem] w-auto max-w-full";

  return (
    <img
      src={logoUrl}
      alt={name}
      onLoad={onLoad}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer-when-downgrade"
      className={[sponsorCarouselLogoClass(), sizeClass, "[image-orientation:from-image]"].join(
        " ",
      )}
    />
  );
}
