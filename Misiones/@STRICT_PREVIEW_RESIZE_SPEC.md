# Corrección Crítica: Procesamiento Obligatorio de Preview con Sharp

## Objetivo
Garantizar que el endpoint `/api/preview/` NUNCA sirva la imagen original intacta. La respuesta debe ser forzosamente un buffer procesado en WebP a máximo 450px de ancho con la marca de agua incrustada.

---

## 1. Refactorización en `/api/preview/route.ts`

- Descargar el archivo maestro desde Supabase Storage como Buffer.
- Pasar el Buffer obligatoriamente por **Sharp** antes de llamar a `res.send()` o `NextResponse`:

```typescript
// Forzar redimensionamiento y conversión a WebP
const resizedBuffer = await sharp(originalFileBuffer)
  .resize({ width: 450, fit: 'inside', withoutEnlargement: true })
  .flatten({ background: '#1E293B' }) // Aplica el fondo plano
  .composite([{ input: watermarkBuffer, tile: true, blend: 'over' }])
  .webp({ quality: 75 })
  .toBuffer();

return new NextResponse(resizedBuffer, {
  status: 200,
  headers: {
    'Content-Type': 'image/webp',
    'Cache-Control': 'no-store, must-revalidate',
  },
});