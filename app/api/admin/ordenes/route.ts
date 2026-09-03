import { NextResponse } from 'next/server';
import { adminAutenticado } from '@/lib/adminAuth';
import { listarOrdenes } from '@/lib/ordenes';
import { getProductos } from '@/lib/productos';
import { resendConfigurado } from '@/lib/notificaciones';

function noAutorizado() {
  return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
}

export async function GET() {
  if (!adminAutenticado()) return noAutorizado();

  const [{ ordenes, error }, catalogo] = await Promise.all([listarOrdenes(), getProductos()]);
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 503 });
  }

  const titulos = new Map((catalogo.productos || []).map((item) => [item.id, item.titulo]));
  const lista = ordenes.map((orden) => ({
    ...orden,
    producto_titulo: titulos.get(orden.producto_id) || orden.producto_id,
  }));

  return NextResponse.json({
    success: true,
    ordenes: lista,
    resendConfigurado: resendConfigurado(),
  });
}
