import type { Metadata } from "next";
import { ProgramLeaguesDirectory } from "@/components/portal/ProgramLeaguesDirectory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ligas del programa",
  description: "Elige la liga deportiva cuyo portal público deseas visitar.",
};

/** Listado de ligas del programa (Yurimaguas, otras sedes, etc.). */
export default function ProgramLeaguesPage() {
  return <ProgramLeaguesDirectory />;
}
