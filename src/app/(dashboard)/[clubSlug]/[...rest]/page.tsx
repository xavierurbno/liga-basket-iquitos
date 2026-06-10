import { redirectClubSlugLegacy } from "@/lib/routing/redirect-club-slug-legacy";

/** `/{slug}/caja`, `/{slug}/jugadores`, etc. → destino en `/liga/...` */
export default async function ClubSlugSubpathRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string; rest: string[] }>;
  searchParams: Promise<{ l?: string }>;
}) {
  const { clubSlug, rest } = await params;
  const { l } = await searchParams;
  return redirectClubSlugLegacy(clubSlug, rest, l);
}
