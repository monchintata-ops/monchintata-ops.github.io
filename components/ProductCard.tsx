'use client';

import Link from 'next/link';
import type { Producto } from '@/lib/types';
import ProductPreview from '@/components/ProductPreview';

export default function ProductCard({ producto }: { producto: Producto }) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden break-words rounded-xl border border-slate-800 bg-slate-900 transition hover:border-amber-500/50">
      <div className="relative overflow-hidden bg-slate-950 p-2">
        <ProductPreview
          src={producto.imagen_preview_url}
          alt={producto.titulo}
          className="aspect-square w-full object-contain transition duration-300 group-hover:scale-105"
        />
        <span className="absolute right-4 top-4 rounded border border-amber-500/30 bg-slate-900/80 px-2 py-1 text-xs text-amber-400 backdrop-blur-md">
          DTF / UV-DTF
        </span>
      </div>
      <Link href={`/producto/${producto.id}`} className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 break-words font-semibold text-slate-200 transition group-hover:text-amber-400">
            {producto.titulo}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{producto.categoria || 'Vector / Imprimible'}</p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <span className="text-lg font-bold text-slate-100">${Number(producto.precio).toFixed(2)}</span>
          <span className="bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition">
            Ver Detalle
          </span>
        </div>
      </Link>
    </article>
  );
}
