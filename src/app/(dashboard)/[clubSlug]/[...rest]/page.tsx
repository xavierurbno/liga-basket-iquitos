import { redirectClubSlugLegacy } from "@/lib/routing/redirect-club-slug-legacy";

/** `/{slug}/caja`, `/{slug}/jugadores`, etc. → destino en `/liga/...` */
export default async function ClubSlugSubpathRedirectPage({
  params,
}: {
  params: Promise<{ clubSlug: string; rest: string[] }>;
}) {
  const { clubSlug, rest } = await params;
  return redirectClubSlugLegacy(clubSlug, rest);
}
