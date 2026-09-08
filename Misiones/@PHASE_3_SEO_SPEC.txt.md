Lee el archivo PHASE_3_SEO_SPEC.md y ejecuta la implementación de la Fase 3:

1. Modifica la ruta de detalle del producto (`/producto/[id]`) para incluir la función nativa `generateMetadata` de Next.js App Router, configurando OpenGraph con la vista previa del Motor 2 (`/api/preview`).
2. Inyecta el esquema estructurado JSON-LD (Schema.org Product) de forma invisible en la página para optimización de Google Shopping.
3. Crea el utilitario `lib/seo.ts` para generación automática de hashtags e higienización de slugs de búsqueda.
4. Revisa la compilación con `.\node_modules\.bin\tsc.cmd --noEmit`.
5. Ejecuta automáticamente en la terminal:
   git add .
   git commit -m "feat: fase 3 - motor de seo dinamico, opengraph y esquema json-ld"
   git push origin main