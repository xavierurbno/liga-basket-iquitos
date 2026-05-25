/** Mensaje legible para fallos de red/auth al conectar con Postgres (portal e intranet). */
export function formatPostgresConnectionError(error: unknown): string {
  const mensajes: string[] = [];
  let current: unknown = error;
  for (let i = 0; i < 6 && current; i++) {
    if (current instanceof Error) {
      mensajes.push(current.message);
      current = (current as Error & { cause?: unknown }).cause;
    } else if (typeof current === "string") {
      mensajes.push(current);
      break;
    } else break;
  }
  const todo = mensajes.join(" ");

  if (todo.includes("ENOTFOUND") || todo.includes("getaddrinfo")) {
    return "No se pudo resolver el host de Supabase (ENOTFOUND). Comprueba tu conexión a internet, desactiva VPN si bloquea DNS, verifica DATABASE_URL en .env.local (Supabase → Connect → Transaction pooler, puerto 6543) y reinicia npm run dev.";
  }

  if (todo.toLowerCase().includes("password authentication failed")) {
    return "Contraseña de base de datos incorrecta. En Supabase → Database resetea la contraseña, copia la URI de nuevo y actualiza .env.local.";
  }

  if (todo.includes("ECONNREFUSED") || todo.includes("ETIMEDOUT")) {
    return "No hubo respuesta del servidor de base de datos. El proyecto Supabase puede estar pausado o la red está bloqueando la salida.";
  }

  const externo = mensajes.find((m) => !m.startsWith("Failed query:"));
  return externo ?? mensajes[0] ?? "Error de conexión con la base de datos.";
}
