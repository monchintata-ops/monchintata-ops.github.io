import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { adminAutenticado } from '@/lib/adminAuth';
import { esArchivoR2KeyValida } from '@/lib/r2Key';
import { storagePrivadoConfigurado, subirArchivoPrivado } from '@/lib/storagePrivado';

export const runtime = 'nodejs';

const MAX_BYTES = 25 * 1024 * 1024;

const TIPOS = {
  impresion: {
    prefix: 'disenos',
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
    const tipo = 'impresion';

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
    const ext = nombre.includes('.') ? `.${nombre.split('.').pop()}` : '';

    if (!(regla.exts as readonly string[]).includes(ext) && !(regla.mime as readonly string[]).includes(archivo.type)) {
      return NextResponse.json(
        { success: false, error: `Formato no permitido para ${tipo}` },
        { status: 400 }
      );
    }

    const key = `${regla.prefix}/${Date.now()}-${nombre}`;
    const buffer = Buffer.from(await archivo.arrayBuffer());
    await subirArchivoPrivado({
      path: key,
      body: buffer,
      contentType: archivo.type || 'application/octet-stream',
    });

    const imagen = sharp(buffer, { density: 300 });
    const previewKey = `previews/${Date.now()}-${nombre.replace(/\.[^.]+$/, '')}.webp`;
    const mockupKey = `mockups/${Date.now()}-${nombre.replace(/\.[^.]+$/, '')}.webp`;
    const preview = await imagen
      .clone()
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    const mockup = await imagen
      .clone()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await Promise.all([
      subirArchivoPrivado({ path: previewKey, body: preview, contentType: 'image/webp' }),
      subirArchivoPrivado({ path: mockupKey, body: mockup, contentType: 'image/webp' }),
    ]);

    if (tipo === 'impresion' && !esArchivoR2KeyValida(key)) {
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
