/** Layout mínimo: las rutas `/{slug}` solo redirigen a `/liga/clubs/{id}/`. */
export const dynamic = "force-dynamic";

export default function ClubSlugLegacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
