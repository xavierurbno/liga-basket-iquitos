# Guía de Despliegue y Pruebas: Edge Function `process-player-image`

Este documento detalla los pasos finales para llevar la lógica de optimización de imágenes a la infraestructura de producción de Supabase.

## 1. Despliegue a la Nube (Supabase CLI)

Ejecuta el siguiente comando desde la raíz de tu proyecto para subir el código y el mapa de importaciones:

```bash
# Navega a la carpeta del proyecto
cd liga-basket-iquitos

# Despliega la función vinculando el mapa de importaciones
supabase functions deploy process-player-image --import-map ./supabase/functions/import_map.json
```

## 2. Configuración de Secretos (Variables de Entorno)

La función requiere permisos de "Service Role" para manipular el Storage y actualizar la base de datos sin restricciones de RLS. Configura los secretos en la nube con este comando:

```bash
supabase secrets set BUCKET_PLAYERS=jugador-fotos
```

> [!NOTE]
> Las variables `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` se inyectan automáticamente en el entorno de Supabase Edge Functions, por lo que no es necesario configurarlas manualmente a menos que desees usar valores externos.

## 3. Prueba de Humo (Smoke Test)

Puedes verificar que la función responde correctamente simulando un evento de base de datos (webhook) con `curl`:

```bash
curl -X POST 'https://<TU_PROJECT_ID>.functions.supabase.co/process-player-image' \
-H 'Authorization: Bearer <TU_ANON_KEY>' \
-H 'Content-Type: application/json' \
-d '{
  "record": {
    "id": "<ID_DE_PRUEBA_EN_PLAYER_DOCUMENTS>",
    "storage_key": "jugadores/test-image.jpg"
  }
}'
```

**Resultado esperado:**
Un JSON con `{ "success": true, "message": "Optimización completa (800px WebP)", "url": "..." }`.

## 4. Verificación en el Dashboard

Para confirmar que la función está operativa y saludable, accede a tu panel de Supabase y observa lo siguiente:

1.  **Estado**: Debe aparecer como "Active" en la sección de **Edge Functions**.
2.  **Logs**: Revisa la pestaña de logs tras realizar una prueba; no debería haber errores de `sharp` o de resolución de módulos.
3.  **Métricas**: Verifica que el tiempo de ejecución sea bajo (generalmente < 500ms para el procesamiento de imagen).
4.  **Storage**: Confirma que en tu bucket aparezca un nuevo archivo con extensión `.webp` tras el disparo de la función.

---
**Fase 3.1 Completada con éxito.** El sistema de optimización asíncrona está listo para escalar con la liga.
