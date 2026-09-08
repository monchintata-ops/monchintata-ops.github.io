import Link from 'next/link';
import Header from '@/components/Header';
import CheckoutModal from '@/components/CheckoutModal';
import ProductGallery from '@/components/ProductGallery';
import { getProductoDetalle } from '@/lib/productos';
import { descripcionSeoProducto, hashtagsProducto, jsonLdProducto, slugProducto } from '@/lib/seo';
import { resolvePreviewUrl } from '@/lib/preview';
import { urlAbsoluta } from '@/lib/siteUrl';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductoPageProps {
  params: { id: string };
}

function nombrePng(titulo: string) {
  return `${titulo.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'diseno'}.png`;
}

export async function generateMetadata({ params }: ProductoPageProps): Promise<Metadata> {
  const { producto, error } = await getProductoDetalle(params.id);

  if (error || !producto) {
    return {
      title: 'Detalle de producto | CreacionArte',
      description: 'Descarga diseños vectoriales y PNGs listos para impresión DTF, UV-DTF y sublimación.',
    };
  }

  const descripcion = descripcionSeoProducto(producto);
  const imageUrl = urlAbsoluta(resolvePreviewUrl(producto.imagen_preview_url));
  const canonicalUrl = urlAbsoluta(`/producto/${producto.id}`);
  const title = `${producto.titulo} | Diseños e Impresión DTF - CreacionArte`;
  const hashtags = hashtagsProducto(producto);

  return {
    title,
    description: descripcion,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [...hashtags, slugProducto(producto.titulo), 'DTF', 'UV-DTF', 'sublimación'],
    openGraph: {
      title,
      description: descripcion,
      url: canonicalUrl,
      siteName: 'CreacionArte',
      type: 'website',
      images: [{ url: imageUrl, width: 1200, height: 1200, alt: producto.titulo }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: descripcion,
      images: [imageUrl],
    },
  };
}

export default async function ProductoDetallePage({ params }: ProductoPageProps) {
  const { producto, error } = await getProductoDetalle(params.id);
  const dpi = producto?.dpi ? String(producto.dpi) : '300 DPI';
  const formato = producto?.formato ? String(producto.formato) : 'DTF / UV-DTF';
  const descripcion =
    typeof producto?.descripcion === 'string' && producto.descripcion.trim()
      ? producto.descripcion
      : null;
  const canonicalUrl = producto ? urlAbsoluta(`/producto/${producto.id}`) : undefined;

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <Header />
      <section className="catalog-shell mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-amber-400"
        >
          ← Volver al Catálogo
        </Link>

        {error ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            No se pudo cargar el producto: {error}
          </div>
        ) : !producto ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-12 text-center">
            <h1 className="text-2xl font-bold text-slate-100">Producto no encontrado</h1>
            <p className="mt-2 text-sm text-slate-400">
              El diseño que buscas no existe en el catálogo o fue retirado.
            </p>
          </div>
        ) : (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(jsonLdProducto(producto, canonicalUrl)),
              }}
            />
            <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:min-h-[520px]">
                <ProductGallery product={producto} title={producto.titulo} />
              </div>

            <div className="flex min-w-0 flex-col justify-center gap-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {producto.categoria || 'Vector / Imprimible'}
                </p>
                <h1 className="mt-2 break-words text-3xl font-extrabold text-slate-100">{producto.titulo}</h1>
                {descripcion && (
                  <p className="mt-3 break-words text-sm leading-relaxed text-slate-400">{descripcion}</p>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                  <dt className="text-slate-500">Resolución</dt>
                  <dd className="mt-1 font-medium text-slate-200">{dpi}</dd>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                  <dt className="text-slate-500">Compatible</dt>
                  <dd className="mt-1 font-medium text-slate-200">{formato}</dd>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                  <dt className="text-slate-500">Vista previa</dt>
                  <dd className="mt-1 font-medium text-slate-200">WebP alta resolución</dd>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                  <dt className="text-slate-500">Archivo de impresión</dt>
                  <dd className="mt-1 font-medium text-slate-200">PNG original (Storage, 15 min)</dd>
                </div>
              </dl>

              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-500">Precio</p>
                <p className="text-3xl font-extrabold text-slate-100">
                  ${Number(producto.precio).toFixed(2)}
                </p>
              </div>

              <CheckoutModal
                producto={{
                  id: producto.id,
                  titulo: producto.titulo,
                  precio: Number(producto.precio),
                }}
                nombreArchivo={nombrePng(producto.titulo)}
              />

                <p className="text-xs text-slate-500">
                  El PNG original no se expone en el catálogo. Tras transferencia verificada o pago PayPal se entrega con una URL firmada de 15 minutos.
                </p>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
