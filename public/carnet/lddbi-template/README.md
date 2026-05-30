# Plantillas PNG — preset `lddbi_template`

Coloca aquí el mockup oficial (sin datos variables del jugador):

| Archivo | Uso |
|---------|-----|
| `anverso-template.png` | Fondo anverso CR80 |
| `reverso-template.png` | Fondo reverso CR80 |

## Tamaño recomendado (300 DPI)

- **1011 × 638 px** (85,6 × 53,98 mm)

## Qué dejar en el PNG (anverso)

- El **diseño completo** (fondo, cabecera visual, pie visual). Sin datos del jugador.

## Qué va en código (encima del PNG, sin franjas extra)

- Logos de federación y liga + textos «FEDERACIÓN…» y «LIGA…» en la zona superior del PNG.
- Etiquetas doradas + valores en blanco (APELLIDOS, NOMBRES, DNI, etc.).
- Foto, número de carnet y género.
- **No** se dibuja cabecera azul ni pie verde adicionales.
- Reverso: QR, texto legal, firmas, vigencia, código de validación, logo liga en pie.

## Archivos en producción

- `anverso-template.png` — 1011×638 px (exportado desde diseño; el repo normaliza si llega otro tamaño).
- `reverso-template.png` — 1011×638 px; debe reservar zonas para QR, legal y firmas (no es otra cara de anverso con foto).

## Ajuste fino

Si algo se desalinea, edita coordenadas en `src/lib/carnet/lddbiTemplateLayout.ts`.

### Tipografía anverso (Zebra ZC300, 300 DPI)

| Elemento | pt (PDF) |
|----------|----------|
| Etiquetas doradas | 7.5 |
| Valores blancos | 8.5 |
| DNI bajo foto | 8.0 |
| Paso entre filas | 4.8 mm |

### Tipografía reverso (Zebra ZC300, 300 DPI)

| Elemento | pt (PDF) | Notas |
|----------|----------|--------|
| Texto legal central | 7.0 | Interlineado ~3.6 mm |
| Nombre firmante | 7.0 | Bold; salto de línea dentro de su columna |
| Cargo (PRESIDENTE / SECRETARIO) | 6.0 | Normal atenuado |
| Vigencia (esquina inf. izquierda) | 6.0 | Normal; más pequeña que los nombres |

## Convivencia con `lddbi_bold`

- **`lddbi_bold`**: diseño degradado (sin cambios).
- **`lddbi_template`**: este mockup PNG.

Elige la plantilla en **Configuración de liga → Carnet CR80**.
