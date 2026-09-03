'use client';

import Link from 'next/link';
import type { Producto } from '@/lib/types';
import ProductPreview from '@/components/ProductPreview';

export default function ProductCard({ producto }: { producto: Producto }) {
  return (
    <Link
      href={`/producto/${producto.id}`}
      className="group flex min-w-0 flex-col overflow-hidden break-words rounded-xl border border-slate-800 bg-slate-900 transition hover:border-amber-500/50"
    >
      <div className="relative aspect-square bg-slate-950 overflow-hidden flex items-center justify-center p-2">
        <ProductPreview
          src={producto.imagen_preview_url}
          alt={producto.titulo}
          className="object-contain w-full h-full group-hover:scale-105 transition duration-300"
        />
        <span className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md text-amber-400 text-xs px-2 py-1 rounded border border-amber-500/30">
          DTF / UV-DTF
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
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
      </div>
    </Link>
  );
}
