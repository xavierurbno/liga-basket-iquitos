# Plantillas CR80 — presets de carnet

Cada preset en configuración de liga apunta a un par anverso/reverso.

## Carpetas

| Carpeta | Uso |
|---------|-----|
| `esquinas-color/` | Diseño esquinas rojas — full color |
| `onda-color/` | Diseño onda roja — full color |
| `_shared/` | Reverso clásica blanco (pares con dorso B/N) |

Dentro de cada carpeta de preset:

- `anverso-template.png`
- `reverso-template.png` (en `_shared` solo `clasica-reverso-template.png`)

Tamaño recomendado: **1011 × 638 px** (CR80 @ 300 DPI).

## Añadir o actualizar assets

1. Coloca los PNG en `public/carnet/_incoming/` (ver `LEEME.txt`).
2. Ejecuta `node scripts/organize-carnet-presets.mjs`.
