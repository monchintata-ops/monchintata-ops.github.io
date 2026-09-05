import { NextResponse } from 'next/server';
import { getOrdenById } from '@/lib/ordenes';
import { createSignedDownloadUrl } from '@/lib/storagePrivado';
import { esUuid } from '@/lib/uuid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: { ordenId: string };
}

function esRutaComprobante(path: string) {
  return path.startsWith('comprobantes/') && !path.includes('..') && !path.includes('\\');
}

export async function GET(_request: Request, { params }: RouteContext) {
  const ordenId = params.ordenId || '';
  if (!esUuid(ordenId)) {
    return NextResponse.json({ error: 'ordenId inválido' }, { status: 400 });
  }

  const orden = await getOrdenById(ordenId);
  const path = String(orden?.comprobante_url || '').trim();
  if (!orden || !esRutaComprobante(path)) {
    return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
  }

  try {
    const signedUrl = await createSignedDownloadUrl(path, 60 * 15);
    return NextResponse.redirect(signedUrl, 302);
  } catch (error) {
    console.error('Error al abrir comprobante:', error);
    return NextResponse.json({ error: 'No se pudo abrir el comprobante' }, { status: 404 });
  }
}
