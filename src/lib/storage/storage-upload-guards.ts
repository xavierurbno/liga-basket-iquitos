export const MAX_GALLERY_UPLOAD_BYTES = 8 * 1024 * 1024;

export const ALLOWED_GALLERY_IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedGalleryMime = (typeof ALLOWED_GALLERY_IMAGE_MIME)[number];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Valida MIME y tamaño antes de procesar imágenes en Storage (service role). */
export function validateGalleryUploadFile(file: File): string | null {
  if (file.size === 0) return "Uno de los archivos está vacío.";
  if (file.size > MAX_GALLERY_UPLOAD_BYTES) {
    return `«${file.name}» supera el límite de 8 MB.`;
  }
  if (!ALLOWED_GALLERY_IMAGE_MIME.includes(file.type as AllowedGalleryMime)) {
    return `Tipo no permitido (${file.type || "desconocido"}). Usa JPG, PNG o WebP.`;
  }
  return null;
}

export function isStorageUuidSegment(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/** Path seguro bajo prefijo `gallery/` (sin `..` ni barras extra). */
export function buildGalleryStoragePath(...segments: string[]): string {
  const safe = segments
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/[^a-zA-Z0-9._-]/g, ""));
  if (safe.length === 0) {
    throw new Error("Segmentos de path inválidos para Storage.");
  }
  return `gallery/${safe.join("/")}`;
}
