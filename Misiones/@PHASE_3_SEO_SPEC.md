# Fase 3: Motor de SEO Dinámico y Metadata Engine

## Objetivo
Generar automáticamente metadatos estructurados (SEO Title, OpenGraph, Twitter Cards, Schema.org JSON-LD y Hashtags de búsqueda) en las rutas de productos (`/producto/[id]`), para maximizar el posicionamiento orgánico en Google y mejorar las vistas previas al compartir enlaces en WhatsApp o redes sociales.

---

## 1. Generación Dinámica de Metadatos (`app/producto/[id]/page.tsx`)

- Implementar la función nativa de Next.js `generateMetadata`:
  - **title:** `[Nombre del Producto] | Diseños e Impresión DTF - CreacionArte`
  - **description:** `Descarga [Nombre del Producto] en formato vectorial y PNG de alta resolución. Optimizado para DTF, UV-DTF y sublimación.`
  - **openGraph:**
    - `title`, `description`, `images`: Apuntando directamente a la URL de preview procesada (`/api/preview/...`).
  - **twitter:** Card tipo `summary_large_image`.

---

## 2. Inyección de Esquema JSON-LD (Schema.org / Google Product)

- Incluir en la vista del producto el tag `<script type="application/ld+json">` con la información estructurada:
  - `@type`: `Product`
  - `name`, `image`, `description`
  - `offers`: Con precio, moneda y disponibilidad.

---

## 3. Generador Interno de Hashtags y Slugs (Backend Helper)

- Crear un helper utilitario `lib/seo.ts` que reciba el producto y retorne:
  - **Slug limpio:** Transforma títulos como `"Balenciaga Paris 2026!"` a `"balenciaga-paris-2026"`.
  - **Hashtags relevantes:** Genera automáticamente tags según categoría (ej: `#DTF #Sublimacion #VectoresTextiles #CreacionArte`).

---

## 4. Verificación y Despliegue Automático

1. Validar tipos: `.\node_modules\.bin\tsc.cmd --noEmit`.
2. Publicar cambios en producción:
   - `git add .`
   - `git commit -m "feat: fase 3 - motor de seo dinamico, opengraph y esquema json-ld"`
   - `git push origin main`