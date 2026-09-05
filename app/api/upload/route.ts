import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { adminAutenticado } from '@/lib/adminAuth';
import { esArchivoR2KeyValida } from '@/lib/r2Key';
import { storagePrivadoConfigurado, subirArchivoPrivado } from '@/lib/storagePrivado';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_BYTES = 25 * 1024 * 1024;
const PREVIEW_BACKGROUND = '#1E293B';

const TIPOS = {
  impresion: {
    prefix: 'disenos',
    mime: ['image/png', 'image/svg+xml'],
    exts: ['.png', '.svg'],
  },
  marca: {
    prefix: 'marcas',
    mime: ['image/png', 'image/svg+xml', 'image/webp'],
    exts: ['.png', '.svg', '.webp'],
  },
  mockup: {
    prefix: 'mockups-originales',
    mime: ['image/png', 'image/svg+xml', 'image/webp'],
    exts: ['.png', '.svg', '.webp'],
  },
} as const;

function nombreSeguro(nombre: string) {
  const base = nombre.split(/[/\\]/).pop() || 'archivo';
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'archivo'
  );
}

function extensionDe(nombre: string) {
  return nombre.includes('.') ? `.${nombre.split('.').pop()}` : '';
}

function formatoPermitido(archivo: File, regla: (typeof TIPOS)[keyof typeof TIPOS]) {
  const nombre = nombreSeguro(archivo.name);
  return (regla.exts as readonly string[]).includes(extensionDe(nombre)) ||
    (regla.mime as readonly string[]).includes(archivo.type);
}

async function prepararMarcaDeAgua(buffer: Buffer) {
  const resultado = await sharp(buffer)
    .resize({ width: 360, height: 180, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let indice = 3; indice < resultado.data.length; indice += 4) {
    resultado.data[indice] = Math.round(resultado.data[indice] * 0.5);
  }

  return sharp(resultado.data, { raw: resultado.info }).png().toBuffer();
}

export async function POST(request: Request) {
  if (!adminAutenticado()) {
    return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
  }

  if (!storagePrivadoConfigurado()) {
    return NextResponse.json(
      { success: false, error: 'Supabase no está configurado en .env.local' },
      { status: 503 }
    );
  }

  try {
    const form = await request.formData();
    const archivo = form.get('file');
    const marca = form.get('watermark');
    const mockupArchivo = form.get('mockup');

    if (!(archivo instanceof File)) {
      return NextResponse.json({ success: false, error: 'Falta el archivo' }, { status: 400 });
    }

    if (archivo.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'El archivo supera 25 MB' },
        { status: 400 }
      );
    }

    const regla = TIPOS.impresion;
    const nombre = nombreSeguro(archivo.name);

    if (!formatoPermitido(archivo, regla)) {
      return NextResponse.json(
        { success: false, error: 'Formato no permitido para impresión HD' },
        { status: 400 }
      );
    }

    for (const [nombreCampo, archivoOpcional, reglaOpcional] of [
      ['watermark', marca, TIPOS.marca],
      ['mockup', mockupArchivo, TIPOS.mockup],
    ] as const) {
      if (archivoOpcional instanceof File &&
        (archivoOpcional.size > MAX_BYTES || !formatoPermitido(archivoOpcional, reglaOpcional))) {
        return NextResponse.json(
          { success: false, error: `Formato o tamaño no permitido para ${nombreCampo}` },
          { status: 400 }
        );
      }
    }

    const timestamp = Date.now();
    const key = `${regla.prefix}/${timestamp}-${nombre}`;
    const buffer = Buffer.from(await archivo.arrayBuffer());
    await subirArchivoPrivado({
      path: key,
      body: buffer,
      contentType: archivo.type || 'application/octet-stream',
    });

    const watermarkBuffer = marca instanceof File ? Buffer.from(await marca.arrayBuffer()) : null;
    const mockupBuffer = mockupArchivo instanceof File ? Buffer.from(await mockupArchivo.arrayBuffer()) : buffer;
    const marcaKey = watermarkBuffer
      ? `${TIPOS.marca.prefix}/${timestamp}-${nombreSeguro((marca as File).name)}`
      : null;
    if (watermarkBuffer && marca instanceof File) {
      await subirArchivoPrivado({
        path: marcaKey!,
        body: watermarkBuffer,
        contentType: marca.type || 'application/octet-stream',
      });
    }

    const baseNombre = nombre.replace(/\.[^.]+$/, '');
    const previewKey = `previews/${timestamp}-${baseNombre}.webp`;
    const mockupKey = `mockups/${timestamp}-${baseNombre}.webp`;
    const marcaProcesada = watermarkBuffer ? await prepararMarcaDeAgua(watermarkBuffer) : null;
    const previewPipeline = sharp(buffer, { density: 300 })
      .resize({ width: 450, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: PREVIEW_BACKGROUND });
    const preview = await (marcaProcesada
      ? previewPipeline
          .composite([{ input: marcaProcesada, tile: true, blend: 'over' }])
          .webp({ quality: 78 })
          .toBuffer()
      : previewPipeline.webp({ quality: 78 }).toBuffer());
    const mockup = await sharp(mockupBuffer, { density: 300 })
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await Promise.all([
      subirArchivoPrivado({ path: previewKey, body: preview, contentType: 'image/webp' }),
      subirArchivoPrivado({ path: mockupKey, body: mockup, contentType: 'image/webp' }),
    ]);

    if (!esArchivoR2KeyValida(key)) {
      return NextResponse.json(
        { success: false, error: 'No se pudo generar un archivo_r2_key válido' },
        { status: 500 }
      );
    }

    const imagenPreviewUrl = `/api/preview?key=${encodeURIComponent(previewKey)}`;
    const disenoMockupUrl = `/api/preview?key=${encodeURIComponent(mockupKey)}`;

    return NextResponse.json({
      success: true,
      archivo_r2_key: key,
      key,
      watermark_key: marcaKey,
      imagen_preview_url: imagenPreviewUrl,
      diseno_mockup_url: disenoMockupUrl,
    });
  } catch (error) {
    console.error('Error al subir a Storage:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al subir el archivo a Storage',
      },
      { status: 500 }
    );
  }
}
