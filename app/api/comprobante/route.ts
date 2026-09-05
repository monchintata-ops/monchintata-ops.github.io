import { NextResponse } from 'next/server';
import { esUuid } from '@/lib/uuid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Compatibilidad: /api/comprobante?ordenId= → /api/comprobante/[ordenId] */
export async function GET(request: Request) {
  const ordenId = new URL(request.url).searchParams.get('ordenId') || '';
  if (!esUuid(ordenId)) {
    return NextResponse.json({ error: 'ordenId inválido' }, { status: 400 });
  }

  const destino = new URL(`/api/comprobante/${ordenId}`, request.url);
  return NextResponse.redirect(destino, 308);
}
