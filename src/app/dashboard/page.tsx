import { redirect } from "next/navigation";

/** Normativas (carga + listado público) en `/normativas/`. */
export default function DashboardPage() {
  redirect("/normativas/");
}
