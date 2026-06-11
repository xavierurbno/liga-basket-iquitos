import { permanentRedirect } from "next/navigation";

/** Documento unificado en /privacidad/ desde v1.2 */
export default function ProteccionDatosRedirectPage() {
  permanentRedirect("/privacidad/");
}
