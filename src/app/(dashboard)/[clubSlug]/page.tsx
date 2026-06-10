import { redirectClubSlugLegacy } from "@/lib/routing/redirect-club-slug-legacy";

/** `/{slug}` → `/liga/clubs/{id}/` */
export default async function ClubSlugRootRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ l?: string }>;
}) {
  const { clubSlug } = await params;
  const { l } = await searchParams;
  return redirectClubSlugLegacy(clubSlug, undefined, l);
}
