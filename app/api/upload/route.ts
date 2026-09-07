import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { adminAutenticado } from '@/lib/adminAuth';
import { esArchivoR2KeyValida } from '@/lib/r2Key';
import { storagePrivadoConfigurado, subirArchivoPrivado } from '@/lib/storagePrivado';
import { subirArchivoPublico } from '@/lib/storagePublico';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_BYTES = 25 * 1024 * 1024;
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
    const mockupKey = `mockups/${timestamp}-${baseNombre}.webp`;
    const mockup = await sharp(mockupBuffer, { density: 300 })
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const mockupUrl = await subirArchivoPublico({ path: mockupKey, body: mockup, contentType: 'image/webp' });

    if (!esArchivoR2KeyValida(key)) {
      return NextResponse.json(
        { success: false, error: 'No se pudo generar un archivo_r2_key válido' },
        { status: 500 }
      );
    }

    const imagenPreviewUrl = `/api/preview/${key
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/')}${marcaKey ? `?watermark=${encodeURIComponent(marcaKey)}` : ''}`;

    return NextResponse.json({
      success: true,
      archivo_r2_key: key,
      key,
      watermark_key: marcaKey,
      imagen_preview_url: imagenPreviewUrl,
      diseno_mockup_url: mockupUrl,
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
