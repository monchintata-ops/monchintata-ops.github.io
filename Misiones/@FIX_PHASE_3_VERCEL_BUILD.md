# Parche de Compilación para Vercel: Fase 3 SEO

## Objetivo
Corregir los errores de compilación estática en Vercel derivados de `generateMetadata` y la inyección del esquema JSON-LD.

---

## 1. Ajustes en `app/producto/[id]/page.tsx`

- Asegurar que la firma de `generateMetadata` sea compatible con Next.js 14/15:

```typescript
import { Metadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id;
  // Obtener producto con manejo de error si no existe
  // ...
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '[https://creacionarte-store.vercel.app](https://creacionarte-store.vercel.app)';

  return {
    title: product ? `${product.titulo} | CreacionArte` : 'Producto | CreacionArte',
    description: product?.descripcion || 'Diseño vectorial para DTF y Sublimación.',
    openGraph: {
      title: product?.titulo,
      images: [`${baseUrl}/api/preview/${id}`],
    },
  };
}