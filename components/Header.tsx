'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ShoppingCart, Image as ImageIcon, Settings } from 'lucide-react';

const CheckoutModal = dynamic(() => import('@/components/CheckoutModal'), { ssr: false });

export default function Header() {
  const [checkoutAbierto, setCheckoutAbierto] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 overflow-hidden border-b border-slate-800 bg-slate-900 text-white">
        <div className="mx-auto flex h-16 min-w-0 max-w-7xl items-center justify-between gap-3 overflow-hidden px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 text-xl font-bold tracking-wide text-amber-400">
            <ImageIcon className="h-6 w-6 shrink-0 text-amber-400" />
            <span className="truncate">
              CREACIONARTE <span className="text-xs font-normal text-slate-400">| Tienda DTF</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:text-amber-400"
            >
              <Settings className="h-4 w-4" />
              <span>Admin</span>
            </Link>
            <button
              type="button"
              onClick={() => setCheckoutAbierto(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm transition hover:bg-slate-700"
            >
              <ShoppingCart className="h-4 w-4 text-amber-400" />
              <span>Carrito</span>
            </button>
          </div>
        </div>
      </header>
      {checkoutAbierto && (
        <CheckoutModal open={checkoutAbierto} onClose={() => setCheckoutAbierto(false)} />
      )}
    </>
  );
}
