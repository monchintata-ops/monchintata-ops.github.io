import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { descargarArchivoPrivado, storagePrivadoConfigurado } from '@/lib/storagePrivado';

export const runtime = 'nodejs';

const WATERMARK_TEXT = process.env.WATERMARK_TEXT?.trim() || 'CREACIONARTE DTF';

function crearMarcaDeAgua() {
  const texto = WATERMARK_TEXT.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return Buffer.from(
  `<svg width="360" height="180" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(-28 180 90)"><text x="180" y="82" text-anchor="middle" fill="white" fill-opacity="0.55" font-family="Arial, sans-serif" font-size="24" font-weight="700">${texto}</text><text x="180" y="112" text-anchor="middle" fill="white" fill-opacity="0.55" font-family="Arial, sans-serif" font-size="13">PREVIEW PROTEGIDA</text></g></svg>`,
  );
}

export async function GET(request: Request) {
  if (!storagePrivadoConfigurado()) {
    return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 503 });
  }

  const key = new URL(request.url).searchParams.get('key') || '';
  if ((!key.startsWith('previews/') && !key.startsWith('mockups/')) || key.includes('..')) {
    return NextResponse.json({ error: 'Clave de vista previa inválida' }, { status: 400 });
  }

  try {
    const objeto = await descargarArchivoPrivado(key);
    const esPreview = key.startsWith('previews/');
    const imagen = sharp(Buffer.from(objeto.bytes), { density: 300 }).resize({
      width: 450,
      height: 450,
      fit: 'inside',
      withoutEnlargement: true,
    });
      const procesada = esPreview
        ? await imagen
            .flatten({ background: '#1E293B' })
            .composite([{ input: crearMarcaDeAgua(), tile: true, blend: 'over' }])
          .webp({ quality: 80 })
          .toBuffer()
      : await imagen.webp({ quality: 82 }).toBuffer();

    return new NextResponse(procesada, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error al leer preview de Storage:', error);
    return NextResponse.json({ error: 'No se pudo leer la vista previa' }, { status: 404 });
  }
}
