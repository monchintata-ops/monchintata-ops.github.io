import Header from '@/components/Header';
import AdminGate from '@/components/AdminGate';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin | CreacionArte',
};

export default function AdminPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <Header />
      <section className="catalog-shell mx-auto max-w-6xl px-4 py-8">
        <AdminGate />
        <p className="mt-6 text-xs text-slate-500">
          Área privada. Catálogo, cuentas bancarias y aprobación de comprobantes. El PNG de impresión vive en{' '}
          <code className="text-slate-400">archivos-privados</code>. Los cambios del catálogo aparecen en{' '}
          <a href="/" className="text-amber-400 hover:underline">
            el catálogo
          </a>
          .
        </p>
      </section>
    </main>
  );
}
