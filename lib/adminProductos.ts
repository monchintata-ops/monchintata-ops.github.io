import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { esArchivoR2KeyValida } from '@/lib/r2Key';
import type { Producto } from '@/lib/types';
import { esUuid } from '@/lib/uuid';

const PRODUCTO_COLUMNS =
  'id, titulo, descripcion, precio, imagen_preview_url, archivo_r2_key, categoria, creado_en';

export type ProductoInput = {
  titulo: string;
  descripcion?: string;
  precio: number;
  categoria?: string;
  imagen_preview_url?: string;
  archivo_r2_key: string;
};

function refrescarCatalogo() {
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/producto', 'layout');
}

function payload(input: ProductoInput) {
  return {
    titulo: input.titulo.trim(),
    descripcion: input.descripcion?.trim() || null,
    precio: Number(input.precio),
    categoria: input.categoria?.trim() || null,
    imagen_preview_url: input.imagen_preview_url?.trim() || '/placeholder_preview.svg',
    archivo_r2_key: input.archivo_r2_key.trim(),
  };
}

export function validarProductoInput(input: ProductoInput): string | null {
  if (!input.titulo?.trim()) return 'El título es obligatorio';
  if (!Number.isFinite(Number(input.precio)) || Number(input.precio) < 0) {
    return 'El precio debe ser un número válido';
  }
  if (!esArchivoR2KeyValida(input.archivo_r2_key)) {
    return 'Sube el archivo de impresión con /api/upload antes de guardar (falta archivo_r2_key).';
  }
  return null;
}

export async function crearProducto(
  input: ProductoInput
): Promise<{ producto: Producto | null; error: string | null }> {
  if (!isSupabaseAdminConfigured()) {
    return { producto: null, error: 'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local' };
  }

  const invalido = validarProductoInput(input);
  if (invalido) {
    return { producto: null, error: invalido };
  }

  const { data, error } = await getSupabaseAdmin()
    .from('productos')
    .insert(payload(input))
    .select(PRODUCTO_COLUMNS)
    .single();

  if (error) {
    return { producto: null, error: error.message };
  }

  refrescarCatalogo();

  return { producto: data as Producto, error: null };
}

export async function actualizarProducto(
  id: string,
  input: ProductoInput
): Promise<{ producto: Producto | null; error: string | null }> {
  if (!isSupabaseAdminConfigured()) {
    return { producto: null, error: 'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local' };
  }

  if (!esUuid(id)) {
    return { producto: null, error: 'ID de producto inválido' };
  }

  const invalido = validarProductoInput(input);
  if (invalido) {
    return { producto: null, error: invalido };
  }

  const { data, error } = await getSupabaseAdmin()
    .from('productos')
    .update(payload(input))
    .eq('id', id)
    .select(PRODUCTO_COLUMNS)
    .single();

  if (error) {
    return { producto: null, error: error.message };
  }

  refrescarCatalogo();

  return { producto: data as Producto, error: null };
}

export async function eliminarProducto(id: string): Promise<{ error: string | null }> {
  if (!isSupabaseAdminConfigured()) {
    return { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local' };
  }

  if (!esUuid(id)) {
    return { error: 'ID de producto inválido' };
  }

  const { error } = await getSupabaseAdmin().from('productos').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  refrescarCatalogo();

  return { error: null };
}

function tituloNormalizado(titulo: string) {
  return titulo.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function limpiarDuplicados(): Promise<{
  conservados: number;
  eliminados: number;
  error: string | null;
}> {
  if (!isSupabaseAdminConfigured()) {
    return { conservados: 0, eliminados: 0, error: 'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local' };
  }

  const { data, error } = await getSupabaseAdmin()
    .from('productos')
    .select(PRODUCTO_COLUMNS)
    .order('creado_en', { ascending: true });

  if (error) {
    return { conservados: 0, eliminados: 0, error: error.message };
  }

  const grupos = new Map<string, Producto[]>();
  for (const producto of (data as Producto[]) || []) {
    const clave = tituloNormalizado(producto.titulo);
    const lista = grupos.get(clave) || [];
    lista.push(producto);
    grupos.set(clave, lista);
  }

  const idsEliminar: string[] = [];
  const idsConservar: string[] = [];

  for (const lista of grupos.values()) {
    if (lista.length === 1) {
      idsConservar.push(lista[0].id);
      continue;
    }

    const preferido =
      lista.find((item) => String(item.archivo_r2_key || '').trim()) || lista[lista.length - 1];
    idsConservar.push(preferido.id);
    for (const extra of lista) {
      if (extra.id !== preferido.id) {
        idsEliminar.push(extra.id);
      }
    }
  }

  if (idsEliminar.length) {
    const { error: deleteError } = await getSupabaseAdmin()
      .from('productos')
      .delete()
      .in('id', idsEliminar);

    if (deleteError) {
      return { conservados: idsConservar.length, eliminados: 0, error: deleteError.message };
    }
  }

  refrescarCatalogo();
  return { conservados: idsConservar.length, eliminados: idsEliminar.length, error: null };
}
