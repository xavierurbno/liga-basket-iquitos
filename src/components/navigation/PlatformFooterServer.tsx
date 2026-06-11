import { headers } from "next/headers";
import { InstitutionalFooter } from "@/components/navigation/footer";
import { shouldShowPlatformFooter } from "@/lib/platform/platform-footer-config";

/**
 * Footer institucional resuelto en servidor (sin parpadeo de usePathname en cliente).
 * Requiere cabecera x-pathname inyectada en proxy.ts.
 */
export async function PlatformFooterServer() {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/";

  if (!shouldShowPlatformFooter(pathname)) {
    return null;
  }

  return <InstitutionalFooter />;
}
