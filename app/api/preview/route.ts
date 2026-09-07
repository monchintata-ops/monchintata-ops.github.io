import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { descargarArchivoPrivado, storagePrivadoConfigurado } from '@/lib/storagePrivado';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WATERMARK_TEXT = process.env.WATERMARK_TEXT?.trim() || 'CREACIONARTE DTF';
const PREVIEW_BACKGROUND = '#1E293B';

function headersImagen(contentType = 'image/webp') {
  return {
    'Content-Type': contentType,
    'Cache-Control': 'no-store, must-revalidate',
  };
}

function crearMarcaDeAgua() {
  const texto = WATERMARK_TEXT.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return Buffer.from(
  `<svg width="360" height="180" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(-28 180 90)"><text x="180" y="82" text-anchor="middle" fill="white" fill-opacity="0.5" font-family="Arial, sans-serif" font-size="24" font-weight="700">${texto}</text><text x="180" y="112" text-anchor="middle" fill="white" fill-opacity="0.5" font-family="Arial, sans-serif" font-size="13">PREVIEW PROTEGIDA</text></g></svg>`,
  );
}

async function prepararMarcaDeAgua(buffer: Buffer) {
  const resultado = await sharp(buffer)
    .resize({ width: 360, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let indice = 3; indice < resultado.data.length; indice += 4) {
    resultado.data[indice] = Math.round(resultado.data[indice] * 0.5);
  }

  return sharp(resultado.data, { raw: resultado.info }).png().toBuffer();
}

async function crearImagenDeError() {
  const svg = Buffer.from(
    `<svg width="450" height="450" xmlns="http://www.w3.org/2000/svg"><rect width="450" height="450" fill="${PREVIEW_BACKGROUND}"/><text x="225" y="215" text-anchor="middle" fill="#f8fafc" font-family="Arial, sans-serif" font-size="22" font-weight="700">Preview no disponible</text><text x="225" y="250" text-anchor="middle" fill="#fbbf24" font-family="Arial, sans-serif" font-size="15">Intenta recargar el catálogo</text></svg>`,
  );
  return sharp(svg).webp({ quality: 80 }).toBuffer();
}

async function procesarPreviewConSharp(buffer: Buffer, watermarkKey = '') {
  const imagen = sharp(buffer, { density: 300, failOn: 'none' });
  const metadata = await imagen.metadata().catch(() => null);

  if (!metadata || (!metadata.width && !metadata.height)) {
    throw new Error('La imagen descargada no tiene metadatos válidos');
  }

  let marcaDeAgua = crearMarcaDeAgua();
  if (watermarkKey.startsWith('marcas/') && !watermarkKey.includes('..')) {
    try {
      const marca = await descargarArchivoPrivado(watermarkKey);
      if (marca.bytes instanceof Uint8Array && marca.bytes.byteLength > 0) {
        marcaDeAgua = await prepararMarcaDeAgua(Buffer.from(marca.bytes));
      }
    } catch (error) {
      console.error(`No se pudo leer la marca de agua (${watermarkKey}):`, error);
    }
  }

  return sharp(buffer, { density: 300, failOn: 'none' })
    .rotate()
    .resize({ width: 450, fit: 'inside', withoutEnlargement: true, background: PREVIEW_BACKGROUND })
    .flatten({ background: PREVIEW_BACKGROUND })
    .composite([{ input: marcaDeAgua, tile: true, blend: 'over' }])
    .webp({ quality: 80 })
    .toBuffer();
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key') || '';
  if ((!key.startsWith('disenos/') && !key.startsWith('previews/') && !key.startsWith('mockups/')) || key.includes('..')) {
    return NextResponse.json({ error: 'Clave de vista previa inválida' }, { status: 400 });
  }

  if (!storagePrivadoConfigurado()) {
    return new NextResponse(new Uint8Array(await crearImagenDeError()), {
      status: 503,
      headers: headersImagen(),
    });
  }

  try {
    const objeto = await descargarArchivoPrivado(key);
    const watermarkKey = new URL(request.url).searchParams.get('watermark') || '';

    if (!(objeto.bytes instanceof Uint8Array) || objeto.bytes.byteLength === 0) {
      throw new Error('Storage devolvió un buffer de imagen vacío');
    }

    const buffer = Buffer.from(objeto.bytes.buffer, objeto.bytes.byteOffset, objeto.bytes.byteLength);
    const procesada = await procesarPreviewConSharp(buffer, watermarkKey);

    return new NextResponse(new Uint8Array(procesada), {
      headers: headersImagen(),
    });
  } catch (error) {
    console.error(`Error al procesar preview con Sharp (${key}):`, error);
    return new NextResponse(new Uint8Array(await crearImagenDeError()), {
      headers: headersImagen(),
    });
  }
}
