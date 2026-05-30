import { OperationalAppHeader } from "@/components/layout/OperationalAppHeader";
import { intranetPortalNavLabel } from "@/lib/auth/intranet-roles";

interface AdminNavbarProps {
  userEmail?: string;
}

/** @deprecated Usar {@link OperationalAppHeader} directamente en el layout. */
export function AdminNavbar({ userEmail }: AdminNavbarProps) {
  return (
    <OperationalAppHeader
      userEmail={userEmail ?? null}
      intranetNavLabel={intranetPortalNavLabel("SUPER_ADMIN")}
    />
  );
}
