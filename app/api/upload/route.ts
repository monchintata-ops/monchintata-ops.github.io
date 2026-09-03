import { NextResponse } from 'next/server';
import { adminAutenticado } from '@/lib/adminAuth';
import { esArchivoR2KeyValida } from '@/lib/r2Key';
import { storagePrivadoConfigurado, subirArchivoPrivado } from '@/lib/storagePrivado';

export const runtime = 'nodejs';

const MAX_BYTES = 25 * 1024 * 1024;

const TIPOS = {
  preview: {
    prefix: 'previews',
    mime: ['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml'],
    exts: ['.webp', '.png', '.jpg', '.jpeg', '.svg'],
  },
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
    const tipoRaw = String(form.get('tipo') || 'impresion');
    const tipo = tipoRaw === 'preview' ? 'preview' : 'impresion';

    if (!(archivo instanceof File)) {
      return NextResponse.json({ success: false, error: 'Falta el archivo' }, { status: 400 });
    }

    if (archivo.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: 'El archivo supera 25 MB' },
        { status: 400 }
      );
    }

    const regla = TIPOS[tipo];
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

    if (tipo === 'impresion' && !esArchivoR2KeyValida(key)) {
      return NextResponse.json(
        { success: false, error: 'No se pudo generar un archivo_r2_key válido' },
        { status: 500 }
      );
    }

    const imagenPreviewUrl =
      tipo === 'preview' ? `/api/preview?key=${encodeURIComponent(key)}` : undefined;

    return NextResponse.json({
      success: true,
      archivo_r2_key: tipo === 'impresion' ? key : undefined,
      key,
      imagen_preview_url: imagenPreviewUrl,
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
