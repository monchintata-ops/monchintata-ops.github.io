import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { descargarArchivoPrivado, storagePrivadoConfigurado } from '@/lib/storagePrivado';

export const runtime = 'nodejs';

const WATERMARK_TEXT = process.env.WATERMARK_TEXT?.trim() || 'CREACIONARTE DTF';
const PREVIEW_BACKGROUND = '#1E293B';

function headersImagen() {
  return {
    'Content-Type': 'image/webp',
    'Cache-Control': 'no-store, max-age=0',
  };
}

function crearMarcaDeAgua() {
  const texto = WATERMARK_TEXT.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return Buffer.from(
  `<svg width="360" height="180" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(-28 180 90)"><text x="180" y="82" text-anchor="middle" fill="white" fill-opacity="0.55" font-family="Arial, sans-serif" font-size="24" font-weight="700">${texto}</text><text x="180" y="112" text-anchor="middle" fill="white" fill-opacity="0.55" font-family="Arial, sans-serif" font-size="13">PREVIEW PROTEGIDA</text></g></svg>`,
  );
}

async function crearImagenDeError() {
  const svg = Buffer.from(
    `<svg width="450" height="450" xmlns="http://www.w3.org/2000/svg"><rect width="450" height="450" fill="${PREVIEW_BACKGROUND}"/><text x="225" y="215" text-anchor="middle" fill="#f8fafc" font-family="Arial, sans-serif" font-size="22" font-weight="700">Preview no disponible</text><text x="225" y="250" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="15">Intenta recargar el catálogo</text></svg>`,
  );
  return sharp(svg).webp({ quality: 80 }).toBuffer();
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
    let procesada: Buffer;

    try {
      const imagen = sharp(Buffer.from(objeto.bytes), { density: 300 }).resize({
        width: 450,
        height: 450,
        fit: 'inside',
        withoutEnlargement: true,
      });
      procesada = esPreview
        ? await imagen
            .flatten({ background: PREVIEW_BACKGROUND })
            .composite([{ input: crearMarcaDeAgua(), tile: true, blend: 'over' }])
            .webp({ quality: 80 })
            .toBuffer()
        : await imagen.webp({ quality: 82 }).toBuffer();
    } catch (error) {
      console.error(`Error procesando preview con Sharp (${key}):`, error);
      procesada = await crearImagenDeError();
    }

    return new NextResponse(new Uint8Array(procesada), {
      headers: headersImagen(),
    });
  } catch (error) {
    console.error(`Error al leer preview de Storage (${key}):`, error);
    return new NextResponse(new Uint8Array(await crearImagenDeError()), { headers: headersImagen() });
  }
}
