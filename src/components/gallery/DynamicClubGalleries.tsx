import Image from "next/image";
import Link from "next/link";
import { photoRepository } from "@/repositories/photoRepository";
import { Camera } from "lucide-react";
import { withQueryTimeout } from "@/lib/db/query-timeout";
import {
  leaguePortalClubGallery,
  leaguePortalInstitutionalGallery,
} from "@/lib/portal/league-portal-paths";
import { reactListKey } from "@/lib/react/listKey";

const GALLERY_MS = 12_000;

/**
 * DynamicClubGalleries — Server Component
 *
 * Grid de tarjetas estilo FEB: una portada por colección,
 * título y contador debajo de la imagen.
 */
function logGalleryFetchFailure(label: string, reason: unknown) {
  const msg = reason instanceof Error ? reason.message : String(reason);
  const cause = reason instanceof Error ? reason.cause : undefined;
  const code =
    cause instanceof Error && "code" in cause
      ? String((cause as NodeJS.ErrnoException).code ?? "")
      : "";
  console.warn(
    `[DynamicClubGalleries] ${label} no disponible${code ? ` (${code})` : ""}: ${msg}. La sección se omite o usa datos parciales.`
  );
}

export async function DynamicClubGalleries({
  leagueId,
  leagueSlug,
  leagueName,
  leagueLogoUrl,
}: {
  leagueId?: string;
  /** Slug para enlaces `/l/[slug]/galeria/...` */
  leagueSlug?: string;
  leagueName?: string;
  leagueLogoUrl?: string | null;
}) {
  try {
    const [clubsR, generalR, countR] = await Promise.allSettled([
      withQueryTimeout(
        photoRepository.getClubsWithPhotos(1, leagueId),
        GALLERY_MS,
        "galleryClubs"
      ),
      withQueryTimeout(photoRepository.getGeneral(1, 30, leagueId), GALLERY_MS, "galleryGeneral"),
      withQueryTimeout(photoRepository.countGeneral(leagueId), GALLERY_MS, "galleryCount"),
    ]);

    const clubsWithPhotos = clubsR.status === "fulfilled" ? clubsR.value : [];
    if (clubsR.status === "rejected") logGalleryFetchFailure("clubes con fotos", clubsR.reason);

    const generalPhotos = generalR.status === "fulfilled" ? generalR.value : [];
    if (generalR.status === "rejected") logGalleryFetchFailure("fotos generales", generalR.reason);

    const totalGeneralFromCount = countR.status === "fulfilled" ? countR.value : null;
    if (countR.status === "rejected") logGalleryFetchFailure("conteo galería general", countR.reason);

    const totalGeneral =
      totalGeneralFromCount != null
        ? totalGeneralFromCount
        : generalPhotos.length > 0
          ? generalPhotos.length
          : 0;

    const hasContent = clubsWithPhotos.length > 0 || totalGeneral > 0;
    if (!hasContent) return null;

    const collectionCount = 1 + clubsWithPhotos.length;
    const collectionLabel =
      collectionCount === 1 ? "1 COLECCIÓN" : `${collectionCount} COLECCIONES`;

    return (
      <section className="space-y-6">
        {/* ── Encabezado ── */}
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black tracking-tight text-[#1e3a5f]">
            TODAS LAS{" "}
            <span className="text-[#005CEE]">GALERÍAS</span>
          </h2>
          <span className="rounded-full bg-[#005CEE]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#005CEE]">
            {collectionLabel}
          </span>
        </div>

        {/* ── Grid de Tarjetas FEB ── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Galería institucional de la liga */}
          <FebCard
            href={
              leagueSlug
                ? leaguePortalInstitutionalGallery(leagueSlug)
                : "/galeria-institucional/"
            }
            coverUrl={generalPhotos[0]?.url ?? null}
            fallbackLogoUrl={leagueSlug ? (leagueLogoUrl ?? null) : "/logo-liga.png"}
            title={
              leagueName
                ? `GALERÍA ${leagueName.length > 28 ? "INSTITUCIONAL" : leagueName}`.toUpperCase()
                : "GALERÍA LDDBI"
            }
            subtitle="Fotos institucionales de la liga"
            photoCount={totalGeneral}
            accentColor="#005CEE"
          />

          {/* Tarjetas por Club */}
          {clubsWithPhotos.map((club, clubIdx) => (
            <FebCard
              key={reactListKey(club.clubId, clubIdx, "club-gallery", club.clubName)}
              href={
                leagueSlug
                  ? leaguePortalClubGallery(leagueSlug, club.clubId)
                  : `/galeria/club/${club.clubId}/`
              }
              coverUrl={club.photos[0]?.url ?? null}
              fallbackLogoUrl={club.logoUrl}
              title={club.clubName}
              subtitle="Galería del club"
              photoCount={club.totalPhotos}
              accentColor={club.colorPrimary ?? "#1e3a5f"}
            />
          ))}
        </div>
      </section>
    );
  } catch (err) {
    console.error("[DynamicClubGalleries] Error fetching data:", err);
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-600">
          No se pudieron cargar las galerías en este momento.
        </p>
      </div>
    );
  }
}

/* ─────────────────────────────────────────────────────── */
/* FebCard — tarjeta individual estilo FEB                 */
/* ─────────────────────────────────────────────────────── */
interface FebCardProps {
  href: string;
  coverUrl: string | null;
  fallbackLogoUrl: string | null;
  title: string;
  subtitle: string;
  photoCount: number;
  accentColor: string;
}

function FebCard({
  href,
  coverUrl,
  fallbackLogoUrl,
  title,
  subtitle,
  photoCount,
  accentColor,
}: FebCardProps) {
  const hasCover = Boolean(coverUrl);

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_-4px_rgba(30,58,95,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_-6px_rgba(30,58,95,0.24)]"
    >
      {/* ── Imagen de portada ── */}
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
        {hasCover ? (
          <Image
            src={coverUrl!}
            alt={`Portada ${title}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : fallbackLogoUrl ? (
          /* Sin fotos aún: usa el logo sobre fondo neutro */
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: `${accentColor}12` }}
          >
            <div className="relative flex h-20 w-20 items-center justify-center opacity-60">
              <Image
                src={fallbackLogoUrl}
                alt={title}
                width={80}
                height={80}
                className="max-h-full max-w-full object-contain"
                style={{ width: "auto", height: "auto" }}
                sizes="80px"
              />
            </div>
          </div>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: `${accentColor}12` }}
          >
            <Camera className="h-10 w-10 opacity-30" style={{ color: accentColor }} />
          </div>
        )}

        {/* Overlay oscuro sutil al hover */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/15" />

        {/* Icono de cámara flotante centrado */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm">
            <Camera className="h-5 w-5 text-[#1e3a5f]" />
          </div>
        </div>

        {/* Barra de color institucional en el borde superior */}
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* ── Contenido inferior ── */}
      <div className="px-4 pb-4 pt-3.5">
        <h3
          className="truncate text-base font-black tracking-tight transition-colors duration-200 group-hover:text-[#005CEE]"
          style={{ color: "#1e3a5f" }}
        >
          {title}
        </h3>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400">{subtitle}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {photoCount} foto{photoCount !== 1 ? "s" : ""}
          </span>
          <span
            className="text-[11px] font-black uppercase tracking-wider transition-colors duration-200 group-hover:underline"
            style={{ color: accentColor }}
          >
            Ver →
          </span>
        </div>
      </div>
    </Link>
  );
}
