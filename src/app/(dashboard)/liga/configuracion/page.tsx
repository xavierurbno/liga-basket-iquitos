import { redirect } from "next/navigation";

/** La pantalla de accesos rápidos se retiró; las mismas destinos están en `/liga` y la barra superior. */
export default function LigaConfiguracionRedirect() {
  redirect("/liga/");
}
