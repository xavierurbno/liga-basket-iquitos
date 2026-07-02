const DEFAULT_FALLBACK =
  "Ocurrió un error inesperado. Comprueba tu conexión e inténtalo de nuevo.";

/** Errores de red reintentables (Server Actions / fetch). */
export function isRetryableNetworkError(err: unknown): boolean {
  const lowered = errorMessage(err).toLowerCase();
  return (
    lowered.includes("failed to fetch") ||
    lowered.includes("err_connection_reset") ||
    lowered.includes("econnreset") ||
    lowered.includes("load failed") ||
    lowered.includes("networkerror")
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error ?? "");
}

/**
 * Traduce mensajes técnicos (Next.js, red, Postgres, Storage) al español.
 * Si el mensaje ya viene en español desde el servidor, se devuelve tal cual.
 */
export function translateActionError(
  error: unknown,
  fallback: string = DEFAULT_FALLBACK,
): string {
  const msg = errorMessage(error).trim();
  if (!msg) return fallback;

  const lowered = msg.toLowerCase();

  if (lowered.includes("unexpected response was received from the server")) {
    return (
      "No se pudo completar la operación por un error del servidor. " +
      "Comprueba tu conexión, evita fotos muy pesadas e inténtalo de nuevo."
    );
  }

  if (
    lowered.includes("failed to fetch") ||
    lowered.includes("err_connection_reset") ||
    lowered.includes("econnreset") ||
    lowered.includes("load failed") ||
    lowered.includes("networkerror when attempting to fetch")
  ) {
    return "Se perdió la conexión con el servidor. Verifica tu red e inténtalo en unos segundos.";
  }

  if (
    lowered.includes("function_invocation_timeout") ||
    lowered.includes("gateway timeout") ||
    lowered.includes("504") ||
    lowered.includes("statement timeout") ||
    lowered.includes("canceling statement due to statement timeout")
  ) {
    return (
      "La operación tardó demasiado (conexión lenta o archivos pesados). " +
      "Intenta de nuevo sin fotos o con mejor señal."
    );
  }

  if (
    lowered.includes("payload too large") ||
    lowered.includes("body exceeded") ||
    lowered.includes("413") ||
    lowered.includes("request entity too large")
  ) {
    return "Los archivos enviados son demasiado grandes. Reduce el tamaño de las fotos (máx. 4 MB) e inténtalo de nuevo.";
  }

  if (lowered.includes("bucket not found")) {
    return "No se pudo subir la imagen porque falta configuración de almacenamiento. Contacta al administrador de la liga.";
  }

  if (lowered.includes("no se pudo subir imagen")) {
    return msg;
  }

  if (lowered.includes("categories_unique") || lowered.includes("categories_club_idx")) {
    return "Ya existe una categoría con ese nombre en este club. Elige otro nombre.";
  }

  if (lowered.includes("duplicate key") || lowered.includes("unique constraint")) {
    return "Ya existe un registro con esos datos. Revisa la información e inténtalo de nuevo.";
  }

  if (lowered.includes("value too long") || lowered.includes("character varying")) {
    return "Algún campo tiene demasiados caracteres. Acorta teléfono, documento o texto e inténtalo de nuevo.";
  }

  if (lowered.includes("failed query:")) {
    return "No se pudo completar la operación en la base de datos. Inténtalo de nuevo.";
  }

  return msg;
}

/** Alias para componentes cliente que capturan excepciones de Server Actions. */
export function formatClientActionError(
  error: unknown,
  fallback?: string,
): string {
  return translateActionError(error, fallback ?? DEFAULT_FALLBACK);
}
