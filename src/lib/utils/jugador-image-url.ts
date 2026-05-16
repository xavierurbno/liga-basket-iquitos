/**
 * Construye URL pública de foto de jugador (Storage Supabase u URL absoluta).
 * Uso compartido entre vistas de club y búsqueda pública limitada.
 */
export function resolvePublicJugadorImageUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  if (rawUrl.includes("/storage/v1/object/sign/")) {
    const [withoutQuery] = rawUrl.split("?");
    return withoutQuery.replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
  }
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const key = rawUrl.replace(/^\/+/, "");
  const hasBucket = 
    key.startsWith(`${process.env.NEXT_PUBLIC_BUCKET_PLAYERS}/`) || 
    key.startsWith(`${process.env.NEXT_PUBLIC_BUCKET_ASSETS}/`);
  
  if (hasBucket) return `${supabaseUrl}/storage/v1/object/public/${key}`;
  return `${supabaseUrl}/storage/v1/object/public/${process.env.NEXT_PUBLIC_BUCKET_PLAYERS}/${key}`;
}
