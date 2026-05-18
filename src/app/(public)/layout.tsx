import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Liga de Basket de Iquitos",
    template: "%s | Liga de Basket Iquitos",
  },
  description: "Portal oficial de la Liga Deportiva Distrital de Basket de Iquitos",
};

export default function PublicPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
