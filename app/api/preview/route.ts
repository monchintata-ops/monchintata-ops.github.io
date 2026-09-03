import { NextResponse } from 'next/server';
import { descargarArchivoPrivado, storagePrivadoConfigurado } from '@/lib/storagePrivado';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!storagePrivadoConfigurado()) {
    return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 503 });
  }

  const key = new URL(request.url).searchParams.get('key') || '';
  if (!key.startsWith('previews/') || key.includes('..')) {
    return NextResponse.json({ error: 'Clave de vista previa inválida' }, { status: 400 });
  }

  try {
    const objeto = await descargarArchivoPrivado(key);

    return new NextResponse(Buffer.from(objeto.bytes), {
      headers: {
        'Content-Type': objeto.contentType || 'image/webp',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error al leer preview de Storage:', error);
    return NextResponse.json({ error: 'No se pudo leer la vista previa' }, { status: 404 });
  }
}
