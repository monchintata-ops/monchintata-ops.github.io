import { NextResponse } from 'next/server';
import { adminAutenticado } from '@/lib/adminAuth';
import { archivarProducto } from '@/lib/adminProductos';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function noAutorizado() {
  return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  if (!adminAutenticado()) {
    return noAutorizado();
  }

  const { error } = await archivarProducto(params.id);
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 503 });
  }

  return NextResponse.json({ success: true });
}
