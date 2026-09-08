import './globals.css';
import type { Metadata } from 'next';
import { metadataBase } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase,
  title: 'CreacionArte - Catálogo DTF & UV-DTF',
  description: 'Descarga diseños vectoriales y PNGs listos para impresión DTF',
  openGraph: {
    title: 'CreacionArte - Catálogo DTF & UV-DTF',
    description: 'Descarga diseños vectoriales y PNGs listos para impresión DTF',
    siteName: 'CreacionArte',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreacionArte - Catálogo DTF & UV-DTF',
    description: 'Descarga diseños vectoriales y PNGs listos para impresión DTF',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="overflow-x-hidden">
      <body className="min-h-screen overflow-x-hidden break-words bg-slate-950 antialiased">
        {children}
      </body>
    </html>
  );
}
