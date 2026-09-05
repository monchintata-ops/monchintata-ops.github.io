import { NextResponse } from 'next/server';
import { plantillaPagoConfirmado } from '@/lib/emails/pagoConfirmado';
import { enviarCorreo } from '@/lib/notificaciones';
import { capturarOrdenPaypal, paypalConfigurado } from '@/lib/paypal';
import { crearOrdenPaypal as registrarOrdenPaypal } from '@/lib/ordenes';
import { getProductoById } from '@/lib/productos';
import { esArchivoR2KeyValida } from '@/lib/r2Key';
import { urlAbsoluta } from '@/lib/siteUrl';
import { createSignedDownloadUrl, STORAGE_SIGNED_URL_TTL_SECONDS } from '@/lib/storagePrivado';
import { EMAIL_RE } from '@/lib/types';
import { esUuid } from '@/lib/uuid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  if (!paypalConfigurado()) {
    return NextResponse.json(
      { success: false, error: 'PayPal no está configurado en .env.local' },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      orderId?: string;
      productoId?: string;
      email?: string;
      nombre?: string;
    };

    const paypalOrderId = String(body.orderId || '').trim();
    const productoId = String(body.productoId || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const nombre = String(body.nombre || '').trim();

    if (!paypalOrderId) {
      return NextResponse.json({ success: false, error: 'Falta orderId de PayPal' }, { status: 400 });
    }
    if (!esUuid(productoId)) {
      return NextResponse.json({ success: false, error: 'productoId inválido' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: 'Indica un email válido' }, { status: 400 });
    }

    const producto = await getProductoById(productoId);
    if (!producto) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }

    const captura = await capturarOrdenPaypal(paypalOrderId);
    if (captura.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: `El pago de PayPal no se completó (${captura.status || 'sin estado'})` },
        { status: 402 }
      );
    }

    if (captura.productoId && captura.productoId !== productoId) {
      return NextResponse.json(
        { success: false, error: 'La orden de PayPal no corresponde a este producto' },
        { status: 403 }
      );
    }

    const pagado = Number(captura.amount);
    const esperado = Number(producto.precio);
    if (Number.isFinite(pagado) && Math.abs(pagado - esperado) > 0.009) {
      return NextResponse.json(
        { success: false, error: 'El monto capturado no coincide con el precio del diseño' },
        { status: 402 }
      );
    }

    const { orden, error } = await registrarOrdenPaypal({
      productoId,
      email,
      nombre: nombre || undefined,
      monto: esperado,
      paypalCaptureId: captura.captureId,
    });

    if (error || !orden) {
      return NextResponse.json(
        { success: false, error: error || 'El pago se capturó pero no se pudo registrar la orden' },
        { status: 503 }
      );
    }

    const fileKey =
      typeof producto.archivo_r2_key === 'string' ? producto.archivo_r2_key.trim() : '';
    if (!esArchivoR2KeyValida(fileKey)) {
      return NextResponse.json({
        success: true,
        ordenId: orden.id,
        downloadUrl: null,
        error: 'Pago registrado, pero el producto no tiene archivo de impresión',
      });
    }

    const downloadUrl = await createSignedDownloadUrl(fileKey);
    const plantilla = plantillaPagoConfirmado({
      nombre,
      producto: producto.titulo,
      monto: esperado,
      downloadUrl,
      minutos: STORAGE_SIGNED_URL_TTL_SECONDS / 60,
      ordenId: orden.id,
      tiendaUrl: urlAbsoluta(`/producto/${producto.id}`),
    });
    await enviarCorreo({
      to: email,
      subject: plantilla.subject,
      text: plantilla.text,
      html: plantilla.html,
    });

    return NextResponse.json({
      success: true,
      ordenId: orden.id,
      downloadUrl,
      expiresIn: STORAGE_SIGNED_URL_TTL_SECONDS,
    });
  } catch (error) {
    console.error('Error al capturar PayPal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al capturar el pago de PayPal',
      },
      { status: 500 }
    );
  }
}
