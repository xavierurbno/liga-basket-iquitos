import { revalidatePath } from "next/cache";
import { leaguePortalHome } from "@/lib/portal/league-portal-paths";

/** Invalida portal público y login tras cambiar marca de una liga. */
export function revalidateLeagueBrandingPaths(leagueSlug?: string | null) {
  revalidatePath("/");
  revalidatePath("/login/");
  revalidatePath("/ligas/");
  if (leagueSlug?.trim()) {
    const path = leaguePortalHome(leagueSlug.trim());
    revalidatePath(path);
    revalidatePath(`${path}galeria-institucional/`);
  }
}
