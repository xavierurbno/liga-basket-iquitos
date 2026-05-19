/** Procesamiento en servidor: evita 181× sharp en paralelo (OOM en dev/Vercel). */
export const GALLERY_SERVER_PROCESS_CHUNK = 4;

export async function mapInChunks<T, R>(
  items: T[],
  chunkSize: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const size = Math.max(1, chunkSize);
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size);
    const part = await Promise.all(slice.map((item, j) => mapper(item, i + j)));
    results.push(...part);
  }
  return results;
}
