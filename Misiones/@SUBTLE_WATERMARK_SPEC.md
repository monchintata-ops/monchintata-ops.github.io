# Ajuste de Estilo y Opacidad de Marca de Agua en Preview

## Objetivo
Hacer la marca de agua significativamente más sutil y limpia en la API de preview (`/api/preview`), reduciendo la opacidad y ajustando la escala de la imagen para no opacar los vectores ni el arte del producto.

---

## 1. Modificación del Procesamiento de Marca de Agua en Sharp (`/api/preview/route.ts`)

- **Escalado de la Marca de Agua:**
  - Redimensionar la marca de agua a un ancho de `150px` antes de repetir en mosaico (`tile`).
- **Control de Transparencia y Tono:**
  - Aplicar un valor alpha de `0.25` (25% de visibilidad / 75% de transparencia).
  - Utilizar el modo de mezcla `overlay` o `soft-light` en la composición de Sharp.

```typescript
// Procesamiento sutil con Sharp
const watermarkResized = await sharp(watermarkBuffer)
  .resize({ width: 150 }) // Escala pequeña y limpia
  .composite([{
    input: Buffer.from([0, 0, 0, 255]), // Ajuste de canal Alpha
    raw: { width: 1, height: 1, channels: 4 },
    tile: true,
    blend: 'dest-in'
  }])
  .ensureAlpha(0.25) // 25% de opacidad real
  .toBuffer();

const finalPreview = await sharp(originalBuffer)
  .resize({ width: 450, fit: 'inside' })
  .flatten({ background: '#1E293B' })
  .composite([{ input: watermarkResized, tile: true, blend: 'overlay' }])
  .webp({ quality: 80 })
  .toBuffer();