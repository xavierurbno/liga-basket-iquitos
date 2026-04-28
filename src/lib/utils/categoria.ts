/**
 * UTILIDAD: Cálculo de Categoría por Edad (Reglas FIBA/FPB)
 */
export type Categoria = "SUB_13" | "SUB_15" | "SUB_17" | "MAYORES" | "VETERANOS";

interface CategoriaInfo {
  categoria: Categoria;
  label: string;
  rango: string;
  colorClass: string;
}

export function calcularCategoria(
  fechaNacimiento: Date,
  anioTorneo: number = new Date().getFullYear()
): Categoria {
  const anioNacimiento = fechaNacimiento.getFullYear();
  const edad = anioTorneo - anioNacimiento;
  if (edad <= 13) return "SUB_13";
  if (edad <= 15) return "SUB_15";
  if (edad <= 17) return "SUB_17";
  if (edad <= 39) return "MAYORES";
  return "VETERANOS";
}

export function getCategoriaInfo(categoria: Categoria): CategoriaInfo {
  const infoMap: Record<Categoria, CategoriaInfo> = {
    SUB_13: { categoria: "SUB_13", label: "Sub 13", rango: "11-13 años", colorClass: "bg-blue-100 text-blue-800" },
    SUB_15: { categoria: "SUB_15", label: "Sub 15", rango: "14-15 años", colorClass: "bg-emerald-100 text-emerald-800" },
    SUB_17: { categoria: "SUB_17", label: "Sub 17", rango: "16-17 años", colorClass: "bg-amber-100 text-amber-800" },
    MAYORES: { categoria: "MAYORES", label: "Mayores", rango: "18-39 años", colorClass: "bg-navy-100 text-navy-800" },
    VETERANOS: { categoria: "VETERANOS", label: "Veteranos", rango: "40+ años", colorClass: "bg-purple-100 text-purple-800" },
  };
  return infoMap[categoria];
}

export function generarNumeroFicha(categoria: Categoria, numero: number, anio: number = new Date().getFullYear()): string {
  const prefixMap: Record<Categoria, string> = { SUB_13: "U13", SUB_15: "U15", SUB_17: "U17", MAYORES: "MAY", VETERANOS: "VET" };
  return `IQ-${anio}-${prefixMap[categoria]}-${numero.toString().padStart(4, "0")}`;
}
