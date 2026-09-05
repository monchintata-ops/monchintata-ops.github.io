# Flujo Automatico de Carga y Procesamiento

## Objetivo

El panel solicita un unico archivo de impresion HD (`.png` o `.svg`). El servidor conserva el original privado y genera los derivados necesarios para el catalogo y el visor Canvas.

## Frontend

`components/AdminCatalogo.tsx` mantiene los campos de metadata del producto, pero solo muestra el selector `Archivo de impresion (.png / .svg)`. Durante el procesamiento muestra: `Procesando resolucion, generando vista previa protegida y preparando mockup...`.

## Pipeline de servidor

`app/api/upload/route.ts` usa Sharp y guarda en el bucket privado `archivos-privados`:

- `disenos/`: archivo HD original para entrega posterior a un pago validado.
- `previews/*.webp`: version de hasta 1000px. La marca de agua diagonal repetida se aplica al responder desde `/api/preview`.
- `mockups/*.webp`: version limpia y transparente de hasta 1000px para el visor Canvas.

La ruta `/api/preview` nunca expone el buffer original. Las previews se convierten a WebP y reciben la marca global configurable con `WATERMARK_TEXT`; los originales solo se entregan mediante una URL firmada despues de validar la orden pagada.