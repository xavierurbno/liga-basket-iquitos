/**
 * Texto para el PDF: "{nombreCategoria} - {GÉNERO}" (ej. "U9 - MIXTO").
 * Si hay más de un género entre inscritos, se muestra MIXTO.
 */
export function lineaCategoriaInstitucional(nombreCategoria: string, generos: string[]): string {
  const base = nombreCategoria.trim();
  const baseUpper = base.toUpperCase();
  const yaIncluyeGenero =
    baseUpper.endsWith(" - MASCULINO") ||
    baseUpper.endsWith(" - FEMENINO") ||
    baseUpper.endsWith(" - MIXTO");

  const validos = generos.filter(Boolean);
  const unicos = [...new Set(validos)];
  let etiqueta = "MIXTO";
  if (unicos.length === 1) {
    const g = unicos[0];
    if (g === "MASCULINO" || g === "FEMENINO" || g === "MIXTO") {
      etiqueta = g;
    }
  }
  if (yaIncluyeGenero) return base;
  return `${base} - ${etiqueta}`;
}
