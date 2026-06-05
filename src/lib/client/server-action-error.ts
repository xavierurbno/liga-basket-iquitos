/** Errores de red al invocar Server Actions (timeout, dev reload, pool saturado). */
export function isServerActionNetworkError(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg === "network error" ||
    msg === "failed to fetch" ||
    msg.includes("load failed") ||
    msg.includes("network")
  );
}

export function serverActionNetworkMessage(): string {
  return "La conexión con el servidor se interrumpió. Espera unos segundos y vuelve a intentar.";
}
