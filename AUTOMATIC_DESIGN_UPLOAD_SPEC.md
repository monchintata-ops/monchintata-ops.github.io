# Refactorizacion del Formulario de Carga de Disenos

## Objetivo

El administrador sube un unico archivo de impresion HD (`.png` o `.svg`). El servidor conserva el original y genera automaticamente la preview comercial con marca de agua y el asset WebP liviano para el visor de mockups.

## Frontend

El formulario de `components/AdminCatalogo.tsx` mantiene los campos de titulo, categoria, precio y descripcion, pero solo muestra el selector `Archivo de impresion (.png / .svg)`. Durante el procesamiento informa: `Procesando resolucion, generando vista previa y aplicando marca de agua...`.

## Backend

`app/api/upload/route.ts` guarda el original bajo `disenos/` en el bucket privado `archivos-privados`. Con Sharp genera:

- `previews/*.webp`: ancho maximo de 1000px y marca global configurable con `WATERMARK_TEXT`.
- `mockups/*.webp`: copia sin marca de agua, redimensionada hasta 1200px para Canvas.

La respuesta devuelve las URLs de ambos derivados para que el producto se guarde sin cargas adicionales.