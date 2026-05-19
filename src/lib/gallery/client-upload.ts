/** Fotos por petición (Server Action bodySizeLimit en next.config). */
export const GALLERY_UPLOAD_BATCH_SIZE = 8;

export const GALLERY_MAX_RECOMMENDED = 300;

export type GalleryUploadResult = { success: boolean; error?: string };

/** Comprime y sube en lotes secuenciales (evita límite de Server Actions). */
export async function uploadGalleryFilesInBatches(
  files: File[],
  buildFormData: (batch: File[]) => FormData,
  upload: (formData: FormData) => Promise<GalleryUploadResult>,
  onProgress?: (done: number, total: number) => void,
): Promise<GalleryUploadResult & { uploaded: number }> {
  const optimized = await Promise.all(files.map(compressImageForGallery));
  const batches = chunkFiles(optimized, GALLERY_UPLOAD_BATCH_SIZE);
  let uploaded = 0;
  const total = optimized.length;

  for (let i = 0; i < batches.length; i++) {
    const result = await upload(buildFormData(batches[i]));
    if (!result.success) {
      return {
        success: false,
        uploaded,
        error:
          result.error ??
          `Error en el lote ${i + 1} de ${batches.length}. Se subieron ${uploaded} de ${total}.`,
      };
    }
    uploaded += batches[i].length;
    onProgress?.(uploaded, total);
  }

  return { success: true, uploaded };
}

export function chunkFiles<T>(items: T[], batchSize: number): T[][] {
  const size = Math.max(1, batchSize);
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Redimensiona en el navegador antes de enviar (reduce peso del FormData). */
export function compressImageForGallery(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          }
        } else if (height > MAX) {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) =>
            resolve(
              blob
                ? new File([blob], file.name.replace(/\.\w+$/i, ".jpg"), {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  })
                : file,
            ),
          "image/jpeg",
          0.82,
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
