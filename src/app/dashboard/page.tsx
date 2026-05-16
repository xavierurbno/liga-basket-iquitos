import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Normativas (carga + listado público) en `/normativas/`. */
export default function DashboardPage() {
  redirect("/normativas/");
}
