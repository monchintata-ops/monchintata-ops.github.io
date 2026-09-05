import { NextResponse } from 'next/server';
import { adminAutenticado } from '@/lib/adminAuth';
import { plantillaPagoConfirmado } from '@/lib/emails/pagoConfirmado';
import { actualizarEstadoOrden, getOrdenById } from '@/lib/ordenes';
import { enviarCorreo } from '@/lib/notificaciones';
import { getProductoById } from '@/lib/productos';
import { esArchivoR2KeyValida } from '@/lib/r2Key';
import { urlAbsoluta } from '@/lib/siteUrl';
import { createSignedDownloadUrl, STORAGE_SIGNED_URL_TTL_SECONDS } from '@/lib/storagePrivado';
import { esUuid } from '@/lib/uuid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: { id: string };
}

function noAutorizado() {
  return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!adminAutenticado()) return noAutorizado();
  if (!esUuid(params.id)) {
    return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { accion?: string };
  const accion = body.accion === 'rechazar' ? 'rechazado' : 'completado';

  const actual = await getOrdenById(params.id);
  if (!actual) {
    return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 });
  }

  const { orden, error } = await actualizarEstadoOrden(params.id, accion);
  if (error || !orden) {
    return NextResponse.json({ success: false, error: error || 'No se pudo actualizar' }, { status: 503 });
  }

  if (accion === 'rechazado') {
    return NextResponse.json({ success: true, orden });
  }

  const producto = await getProductoById(orden.producto_id);
  const fileKey =
    typeof producto?.archivo_r2_key === 'string' ? producto.archivo_r2_key.trim() : '';

  let downloadUrl: string | null = null;
  if (producto && esArchivoR2KeyValida(fileKey)) {
    try {
      downloadUrl = await createSignedDownloadUrl(fileKey);
    } catch (err) {
      const detalle = err instanceof Error ? err.message : String(err);
      console.warn(`[admin/ordenes] PNG no firmable (orden ${orden.id}): ${detalle}`);
      downloadUrl = null;
    }
  }

  const plantilla = plantillaPagoConfirmado({
    nombre: orden.nombre,
    producto: producto?.titulo || 'tu diseño',
    monto: Number(orden.monto || producto?.precio || 0),
    downloadUrl,
    minutos: STORAGE_SIGNED_URL_TTL_SECONDS / 60,
    ordenId: orden.id,
    tiendaUrl: producto ? urlAbsoluta(`/producto/${producto.id}`) : urlAbsoluta('/'),
  });

  const correo = await enviarCorreo({
    to: orden.email,
    subject: plantilla.subject,
    text: plantilla.text,
    html: plantilla.html,
  });

  return NextResponse.json({
    success: true,
    orden,
    downloadUrl,
    expiresIn: STORAGE_SIGNED_URL_TTL_SECONDS,
    emailEnviado: correo.enviado,
    emailError: correo.enviado ? null : correo.error || 'No se pudo enviar el correo',
  });
}
