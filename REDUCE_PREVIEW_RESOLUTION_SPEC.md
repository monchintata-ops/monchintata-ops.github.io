# Reduccion de Resolucion en Vista Previa

## Objetivo

Las previews publicas se entregan con una resolucion maxima de 450px, suficiente para inspeccionar el producto en el catalogo pero inadecuada para reutilizarlo como archivo de impresion.

## Implementacion

- `app/api/upload/route.ts` genera `previews/*.webp` con Sharp a un maximo de 450px, manteniendo la proporcion, el fondo `#1E293B` y la marca de agua.
- `app/api/preview/route.ts` vuelve a aplicar el limite de 450px al servir la preview, manteniendo el fondo y la marca diagonal reforzada.
- El asset de mockup conserva su limite independiente de 1000px para el visor Canvas.

Ambas etapas usan `fit: 'inside'` y `withoutEnlargement: true`, por lo que las imagenes pequenas no se escalan artificialmente.