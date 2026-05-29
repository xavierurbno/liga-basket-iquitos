import { headers } from "next/headers";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";
import {
  checkRateLimit,
  rateLimitExceededMessage,
  type RateLimitScope,
} from "@/lib/security/rate-limit";

/** Devuelve mensaje de error si se excedió el límite; null si la petición puede continuar. */
export async function enforceRateLimit(scope: RateLimitScope): Promise<string | null> {
  const headerStore = await headers();
  const clientIp = getClientIpFromHeaders(headerStore);
  const result = checkRateLimit(scope, clientIp);
  if (!result.allowed) {
    return rateLimitExceededMessage(result.retryAfterSec);
  }
  return null;
}
