import type { Metadata } from "next";
import { getPlatformName } from "@/lib/platform/platform-config";

const platformName = getPlatformName();

export const metadata: Metadata = {
  title: {
    default: platformName,
    template: `%s | ${platformName}`,
  },
  description: "Portales públicos de ligas deportivas",
};

export default function PublicPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
