import { NextResponse } from 'next/server';
import { adminAutenticado } from '@/lib/adminAuth';
import { crearProducto, validarProductoInput, type ProductoInput } from '@/lib/adminProductos';
import { getProductos } from '@/lib/productos';

function noAutorizado() {
  return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
}

export async function GET() {
  if (!adminAutenticado()) {
    return noAutorizado();
  }

  const { productos, error } = await getProductos();
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 503 });
  }

  return NextResponse.json({ success: true, productos });
}

export async function POST(request: Request) {
  if (!adminAutenticado()) {
    return noAutorizado();
  }

  try {
    const body = (await request.json().catch(() => ({}))) as ProductoInput;
    const invalido = validarProductoInput(body);
    if (invalido) {
      return NextResponse.json({ success: false, error: invalido }, { status: 400 });
    }

    const { producto, error } = await crearProducto(body);
    if (error || !producto) {
      return NextResponse.json(
        { success: false, error: error || 'No se pudo crear el producto' },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, producto });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json({ success: false, error: 'Error al crear el producto' }, { status: 500 });
  }
}
