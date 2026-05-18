import { redirectClubSlugLegacy } from "@/lib/routing/redirect-club-slug-legacy";

/** `/{slug}` → `/liga/clubs/{id}/` */
export default async function ClubSlugRootRedirectPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  return redirectClubSlugLegacy(clubSlug);
}
