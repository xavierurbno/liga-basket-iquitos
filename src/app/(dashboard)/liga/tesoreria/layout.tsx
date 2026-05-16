import { redirect } from "next/navigation";
import { getTreasurySession } from "@/lib/auth/treasury-session";

export const dynamic = "force-dynamic";

export default async function TesoreriaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getTreasurySession();
  if (!session) redirect("/login");
  if (session.access.kind === "none") {
    redirect("/liga/");
  }
  return <>{children}</>;
}
