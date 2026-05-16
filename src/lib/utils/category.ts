/**
 * UTILIDAD: Cálculo de Categoría por Edad (Reglas FIBA/FPB)
 */
export type Categoria = "SUB_13" | "SUB_15" | "SUB_17" | "MAYORES" | "VETERANOS";

/** Edad en años cumplidos (misma lógica que validaciones de tutor en Zod). */
export function calcularEdadAnios(birthdate: Date, hoy: Date = new Date()): number {
  return (
    hoy.getFullYear() -
    birthdate.getFullYear() -
    (hoy < new Date(hoy.getFullYear(), birthdate.getMonth(), birthdate.getDate())
      ? 1
      : 0)
  );
}

interface CategoriaInfo {
  category: Categoria;
  label: string;
  rango: string;
  colorClass: string;
}

export function calcularCategoria(
  birthdate: Date,
  anioTorneo: number = new Date().getFullYear()
): Categoria {
  const anioNacimiento = birthdate.getFullYear();
  const edad = anioTorneo - anioNacimiento;
  if (edad <= 13) return "SUB_13";
  if (edad <= 15) return "SUB_15";
  if (edad <= 17) return "SUB_17";
  if (edad <= 39) return "MAYORES";
  return "VETERANOS";
}

export function getCategoriaInfo(category: Categoria): CategoriaInfo {
  const infoMap: Record<Categoria, CategoriaInfo> = {
    SUB_13: { category: "SUB_13", label: "Sub 13", rango: "11-13 años", colorClass: "bg-blue-100 text-blue-800" },
    SUB_15: { category: "SUB_15", label: "Sub 15", rango: "14-15 años", colorClass: "bg-emerald-100 text-emerald-800" },
    SUB_17: { category: "SUB_17", label: "Sub 17", rango: "16-17 años", colorClass: "bg-amber-100 text-amber-800" },
    MAYORES: { category: "MAYORES", label: "Mayores", rango: "18-39 años", colorClass: "bg-navy-100 text-navy-800" },
    VETERANOS: { category: "VETERANOS", label: "Veteranos", rango: "40+ años", colorClass: "bg-purple-100 text-purple-800" },
  };
  return infoMap[category];
}

export function generarNumeroFicha(category: Categoria, numero: number, anio: number = new Date().getFullYear()): string {
  const prefixMap: Record<Categoria, string> = { SUB_13: "U13", SUB_15: "U15", SUB_17: "U17", MAYORES: "MAY", VETERANOS: "VET" };
  return `IQ-${anio}-${prefixMap[category]}-${numero.toString().padStart(4, "0")}`;
}
