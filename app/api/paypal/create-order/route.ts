import { NextResponse } from 'next/server';
import { crearOrdenPaypal, paypalConfigurado } from '@/lib/paypal';
import { getProductoById } from '@/lib/productos';
import { urlAbsoluta } from '@/lib/siteUrl';
import { esUuid } from '@/lib/uuid';

export async function POST(request: Request) {
  if (!paypalConfigurado()) {
    return NextResponse.json(
      { success: false, error: 'PayPal no está configurado en .env.local' },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { productoId?: string };
    if (!body.productoId || !esUuid(body.productoId)) {
      return NextResponse.json({ success: false, error: 'productoId inválido' }, { status: 400 });
    }

    const producto = await getProductoById(body.productoId);
    if (!producto) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }

    const checkoutUrl = urlAbsoluta(`/producto/${producto.id}`);
    const orderId = await crearOrdenPaypal({
      productoId: producto.id,
      titulo: producto.titulo,
      monto: Number(producto.precio),
      returnUrl: checkoutUrl,
      cancelUrl: checkoutUrl,
    });

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error('Error al crear orden PayPal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear la orden de PayPal',
      },
      { status: 500 }
    );
  }
}
