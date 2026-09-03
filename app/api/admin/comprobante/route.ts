import { NextResponse } from 'next/server';
import { adminAutenticado } from '@/lib/adminAuth';
import { createSignedDownloadUrl } from '@/lib/storagePrivado';

export async function GET(request: Request) {
  if (!adminAutenticado()) {
    return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
  }

  const path = new URL(request.url).searchParams.get('path') || '';
  if (!path.startsWith('comprobantes/') || path.includes('..')) {
    return NextResponse.json({ success: false, error: 'Ruta de comprobante inválida' }, { status: 400 });
  }

  try {
    const url = await createSignedDownloadUrl(path, 60 * 30);
    return NextResponse.json({ success: true, url });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'No se pudo firmar el comprobante' },
      { status: 404 }
    );
  }
}
