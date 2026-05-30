/** Mensajes unificados para requireAuth y withAuth. */
export const AUTH_ERRORS = {
  unauthenticated: "No autenticado. Por favor, inicia sesión.",
  noRole: "Acceso denegado: el usuario no tiene rol en app_metadata.",
  insufficientRole: "Acceso denegado: Permisos insuficientes.",
  unauthorizedClub: "Acceso denegado: Intento de modificación no autorizada.",
  unauthorizedLeague: "Acceso denegado: No autorizado en esta liga.",
  authFailure: "Error de autorización.",
} as const;
