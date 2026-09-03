import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { getProductos } from '@/lib/productos';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { productos, error } = await getProductos();

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <Header />
      <section className="catalog-shell mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 min-w-0">
          <h1 className="break-words text-3xl font-extrabold text-slate-100">Catálogo de Diseños Imprimibles</h1>
          <p className="text-slate-400 text-sm mt-1">
            Formatos vectoriales y PNGs optimizados para DTF y UV-DTF. Descarga inmediata post-pago.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            No se pudo cargar el catálogo: {error}
          </div>
        ) : productos.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-8 text-center text-sm text-slate-400">
            <p className="text-slate-200 font-medium">Supabase está conectado.</p>
            <p className="mt-2">
              La tabla <code className="text-amber-400">productos</code> no tiene filas todavía.
              Abre el SQL Editor y ejecuta <code className="text-amber-400">supabase/seed_mision_003.sql</code>.
            </p>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {productos.map((prod) => (
              <ProductCard key={prod.id} producto={prod} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
