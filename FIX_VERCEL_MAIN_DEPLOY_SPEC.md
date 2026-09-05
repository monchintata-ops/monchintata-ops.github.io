# Sincronizacion de Produccion en Vercel

## Objetivo

Las respuestas de la API de imagen deben evitar que Vercel o un CDN sirvan previews antiguas despues de una subida o actualizacion.

## Implementacion

`app/api/preview/route.ts` responde las imagenes con:

```text
Cache-Control: no-store, must-revalidate
```

La rama `main` es la rama que debe estar conectada al proyecto de produccion en Vercel. Cada cambio validado se publica con `git push origin main`; la configuracion de la integracion y el dominio de produccion se administran en Vercel.