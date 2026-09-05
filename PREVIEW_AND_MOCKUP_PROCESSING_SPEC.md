# Procesamiento de Preview, Marca de Agua y Mockups

## Objetivo

El panel permite seleccionar el archivo de impresion HD y, de forma opcional, una marca de agua original y una imagen transparente dedicada al mockup.

## Pipeline

`app/api/upload/route.ts` guarda en el bucket privado `archivos-privados`:

- `disenos/`: original HD, sin modificar, para descargas posteriores a un pago validado.
- `marcas/`: marca de agua subida en su calidad original.
- `previews/*.webp`: preview con fondo solido `#1E293B`, maximo 1000px y marca de agua procesada al 55%.
- `mockups/*.webp`: asset transparente de hasta 1000px para el visor Canvas. Usa la imagen dedicada cuando se proporciona y, en otro caso, el archivo de impresion.

La marca de agua y el mockup se seleccionan junto con el archivo de impresion y se procesan en una sola operacion al guardar el producto. `/api/preview` vuelve a normalizar las previews publicas, aplica el fondo y la marca global reforzada, y nunca permite acceder directamente al prefijo `disenos/`.