import type { ReactNode } from "react";
import { InstitutionalFooter } from "@/components/navigation/footer";

type PlatformPageShellProps = {
  children: ReactNode;
  className?: string;
  /** Por defecto incluye el footer institucional al final de la columna flex. */
  showFooter?: boolean;
};

/**
 * Contenedor flex min-h-screen con footer institucional fijo al pie (sin gate cliente).
 */
export function PlatformPageShell({
  children,
  className = "bg-[#F5F5F5]",
  showFooter = true,
}: PlatformPageShellProps) {
  return (
    <div className={`flex min-h-screen flex-col ${className}`.trim()}>
      <div className="flex flex-1 flex-col">{children}</div>
      {showFooter ? <InstitutionalFooter /> : null}
    </div>
  );
}
