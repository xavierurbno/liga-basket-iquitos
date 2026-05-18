import { serve } from "std/http/server.ts"
import { createClient } from "supabase"
import sharp from "sharp"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlayerRecord {
  id: string;
  storage_key: string;
}

interface WebhookPayload {
  record: PlayerRecord;
}

function verifyWebhookSecret(req: Request): boolean {
  const expected = Deno.env.get('PROCESS_PLAYER_IMAGE_WEBHOOK_SECRET')?.trim()
  if (!expected) {
    return Deno.env.get('ALLOW_OPEN_PLAYER_IMAGE_WEBHOOK') === 'true'
  }
  const raw =
    req.headers.get('x-webhook-secret') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    ''
  return raw === expected
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!verifyWebhookSecret(req)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { record }: WebhookPayload = await req.json()
    
    if (!record?.id || !record?.storage_key) {
      return new Response(JSON.stringify({ error: 'Falta información del registro/archivo' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const bucket = Deno.env.get('BUCKET_PLAYERS') || 'jugador-fotos'
    const storageKey = record.storage_key

    // 1. Descargar la imagen original
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(storageKey)

    if (downloadError || !fileData) {
      throw new Error(`Error descargando de Storage: ${downloadError?.message}`)
    }

    // Convertir Blob a Buffer compatible con Sharp
    const arrayBuffer = await fileData.arrayBuffer()
    const inputBuffer = new Uint8Array(arrayBuffer)

    // 2. Procesamiento con Sharp
    // - Redimensionar a 800px de ancho (Optimización Fase 3.1)
    // - Convertir a WebP con calidad 80
    const optimizedBuffer = await sharp(inputBuffer)
      .resize(800, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    // 3. Subir la imagen optimizada (ruta .webp)
    const optimizedKey = storageKey.replace(/\.[^/.]+$/, "") + ".webp"
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(optimizedKey, optimizedBuffer, {
        contentType: 'image/webp',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`Error subiendo optimizada: ${uploadError.message}`)
    }

    // 4. Obtener URL pública y actualizar la tabla física
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(optimizedKey)

    const { error: updateError } = await supabase
      .from('player_documents')
      .update({ 
        public_url: publicUrl,
        storage_key: optimizedKey,
        mime_type: 'image/webp',
        size_bytes: optimizedBuffer.length
      })
      .eq('id', record.id)

    if (updateError) {
      throw new Error(`Error actualizando DB: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Optimización completa (800px WebP)',
        url: publicUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const err = error as Error
    console.error('[IMAGE_PROCESS_ERROR]', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
