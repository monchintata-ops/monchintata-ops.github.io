import { NextResponse } from 'next/server';
import { adminAutenticado } from '@/lib/adminAuth';
import {
  actualizarProducto,
  eliminarProducto,
  validarProductoInput,
  type ProductoInput,
} from '@/lib/adminProductos';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: { id: string };
}

function noAutorizado() {
  return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!adminAutenticado()) {
    return noAutorizado();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as ProductoInput;
    const invalido = validarProductoInput(body);
    if (invalido) {
      return NextResponse.json({ success: false, error: invalido }, { status: 400 });
    }

    const { producto, error } = await actualizarProducto(params.id, body);
    if (error || !producto) {
      return NextResponse.json(
        { success: false, error: error || 'No se pudo guardar el producto' },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, producto });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json(
      { success: false, error: 'Error al guardar el producto' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!adminAutenticado()) {
    return noAutorizado();
  }

  try {
    const { error } = await eliminarProducto(params.id);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al borrar producto:', error);
    return NextResponse.json({ success: false, error: 'Error al borrar el producto' }, { status: 500 });
  }
}
