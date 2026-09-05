import { NextResponse } from 'next/server';
import { getProductos } from '@/lib/productos';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Catálogo público para el checkout (sin keys de impresión). */
export async function GET() {
  const { productos, error } = await getProductos();
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 503 });
  }

  return NextResponse.json({
    success: true,
    productos: productos.map((item) => ({
      id: item.id,
      titulo: item.titulo,
      precio: Number(item.precio),
    })),
  });
}
