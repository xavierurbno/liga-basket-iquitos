import { extractValidationTokenFromUrl } from "@/lib/validation/extract-validation-token";

/** URL `/validar` con token firmado v1 (no UUID legado). */
export function isSignedValidationUrl(url: string | null | undefined): boolean {
  const token = extractValidationTokenFromUrl(url);
  return Boolean(token?.startsWith("v1."));
}
