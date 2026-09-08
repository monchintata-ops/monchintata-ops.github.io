import { NextResponse } from 'next/server';
import { adminAutenticado } from '@/lib/adminAuth';
import { listarProductosInactivos } from '@/lib/adminProductos';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function noAutorizado() {
  return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
}

export async function GET() {
  if (!adminAutenticado()) {
    return noAutorizado();
  }

  const { productos, error } = await listarProductosInactivos();
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 503 });
  }

  return NextResponse.json({ success: true, productos });
}
