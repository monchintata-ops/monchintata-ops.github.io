import { NextResponse } from 'next/server';
import { getOrdenById, isOrdenPagada } from '@/lib/ordenes';
import { getProductoById } from '@/lib/productos';
import { esArchivoR2KeyValida } from '@/lib/r2Key';
import {
  createSignedDownloadUrl,
  STORAGE_SIGNED_URL_TTL_SECONDS,
  storagePrivadoConfigurado,
} from '@/lib/storagePrivado';
import { esUuid } from '@/lib/uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { productoId, ordenId, tokenPago } = body as {
      productoId?: string;
      ordenId?: string;
      tokenPago?: string;
    };

    const idOrden = ordenId || tokenPago;

    if (!idOrden || typeof idOrden !== 'string' || !esUuid(idOrden)) {
      return NextResponse.json(
        { success: false, error: 'Falta un ordenId válido. Completa el checkout primero.' },
        { status: 400 }
      );
    }

    if (!productoId || !esUuid(productoId)) {
      return NextResponse.json(
        { success: false, error: 'Falta productoId en el cuerpo de la petición' },
        { status: 400 }
      );
    }

    const orden = await getOrdenById(idOrden);
    if (!orden) {
      return NextResponse.json(
        { success: false, error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    if (orden.producto_id !== productoId) {
      return NextResponse.json(
        { success: false, error: 'La orden no corresponde a este producto' },
        { status: 403 }
      );
    }

    if (!isOrdenPagada(orden.estado)) {
      return NextResponse.json(
        { success: false, error: 'La orden no está pagada' },
        { status: 403 }
      );
    }

    const producto = await getProductoById(productoId);
    if (!producto) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    if (!storagePrivadoConfigurado()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase no está configurado en .env.local',
          ordenId: orden.id,
        },
        { status: 503 }
      );
    }

    const fileKey =
      typeof producto.archivo_r2_key === 'string' ? producto.archivo_r2_key.trim() : '';
    if (!esArchivoR2KeyValida(fileKey)) {
      return NextResponse.json(
        { success: false, error: 'El producto no tiene un archivo de impresión válido' },
        { status: 404 }
      );
    }

    const downloadUrl = await createSignedDownloadUrl(fileKey);

    return NextResponse.json({
      success: true,
      downloadUrl,
      expiresIn: STORAGE_SIGNED_URL_TTL_SECONDS,
      ordenId: orden.id,
      fileKey,
    });
  } catch (error) {
    console.error('Error al firmar URL de Storage:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar enlace de descarga' },
      { status: 500 }
    );
  }
}
