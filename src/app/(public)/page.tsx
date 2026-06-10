import { permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { ProgramLeaguesDirectory } from "@/components/portal/ProgramLeaguesDirectory";
import { getPlatformName } from "@/lib/platform/platform-config";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ l?: string }>;
}

export const metadata: Metadata = {
  title: getPlatformName(),
  description: "Directorio de ligas deportivas. Elige el portal de tu competición.",
};

/** `/` = directorio de ligas. LDDBI y el resto viven en `/l/{slug}/`. */
export default async function PublicPortalRootPage({ searchParams }: Props) {
  const { l: legacySlug } = await searchParams;

  if (legacySlug?.trim()) {
    permanentRedirect(`/l/${legacySlug.trim()}/`);
  }

  return <ProgramLeaguesDirectory />;
}
