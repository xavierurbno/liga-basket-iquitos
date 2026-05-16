/** Edad en años cumplidos a la transactionDate de referencia (por defecto hoy). */
export function calcularEdad(birthdate: Date, referencia: Date = new Date()): number {
  let edad = referencia.getFullYear() - birthdate.getFullYear();
  const m = referencia.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && referencia.getDate() < birthdate.getDate())) {
    edad -= 1;
  }
  return Math.max(0, edad);
}
