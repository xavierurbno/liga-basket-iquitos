import { redirect } from "next/navigation";
import { unauthenticatedReadDb } from "@/lib/db/operational-db-access";
import { leagueRepository } from "@/repositories/league.repository";

export const dynamic = "force-dynamic";

/** Redirige a la URL canónica por slug (`/l/[slug]/normativas/`). */
export default async function NormativasLegacyRedirectPage() {
  const defaultLeague = await leagueRepository.findDefaultForPortal(unauthenticatedReadDb());
  const slug = defaultLeague?.slug?.trim();

  if (slug) {
    redirect(`/l/${slug}/normativas/`);
  }

  redirect("/");
}
