import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { STORAGE_BUCKET_PRIVADO } from '@/lib/storagePrivado';
import { STORAGE_BUCKET_MOCKUPS } from '@/lib/storagePublico';
import { esArchivoR2KeyValida } from '@/lib/r2Key';
import type { Producto } from '@/lib/types';
import { esUuid } from '@/lib/uuid';

const PRODUCTO_COLUMNS =
  'id, titulo, descripcion, precio, imagen_preview_url, diseno_mockup_url, archivo_r2_key, categoria, creado_en';
const PRODUCTO_COLUMNS_WITH_CREATOR =
  'id, titulo, descripcion, precio, imagen_preview_url, diseno_mockup_url, archivo_r2_key, categoria, creador_id, creado_en';
const PRODUCTO_COLUMNS_LEGACY =
  'id, titulo, descripcion, precio, imagen_preview_url, archivo_r2_key, categoria, creado_en';

export type ProductoInput = {
  titulo: string;
  descripcion?: string;
  precio: number;
  categoria?: string;
  imagen_preview_url?: string;
  diseno_mockup_url?: string;
  archivo_r2_key: string;
  creador_id?: string | null;
  status?: 'active' | 'archived' | 'pending_review' | string | null;
  total_ventas?: number | string | null;
  created_at?: string | null;
};

function refrescarCatalogo() {
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/producto', 'layout');
}

function payload(input: ProductoInput) {
  const base = {
    titulo: input.titulo.trim(),
    descripcion: input.descripcion?.trim() || null,
    precio: Number(input.precio),
    categoria: input.categoria?.trim() || null,
    imagen_preview_url: input.imagen_preview_url?.trim() || '/placeholder_preview.svg',
    diseno_mockup_url: input.diseno_mockup_url?.trim() || null,
    archivo_r2_key: input.archivo_r2_key.trim(),
  };

  return {
    ...base,
    ...(input.creador_id?.trim() ? { creador_id: input.creador_id.trim() } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.total_ventas !== undefined ? { total_ventas: Number(input.total_ventas || 0) } : {}),
    ...(input.created_at ? { created_at: input.created_at } : {}),
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

  const basePayload = payload(input);
  const { data, error } = await getSupabaseAdmin()
    .from('productos')
    .insert(basePayload)
    .select(PRODUCTO_COLUMNS)
    .single();

  if (error && /creador_id|column .* does not exist/i.test(error.message)) {
    const retry = await getSupabaseAdmin()
      .from('productos')
      .insert({ ...basePayload })
      .select(PRODUCTO_COLUMNS)
      .single();

    if (retry.error) {
      return { producto: null, error: retry.error.message };
    }

    const producto = retry.data as Producto;
    refrescarCatalogo();
    return { producto, error: null };
  }

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

  const basePayload = payload(input);
  const { data, error } = await getSupabaseAdmin()
    .from('productos')
    .update(basePayload)
    .eq('id', id)
    .select(PRODUCTO_COLUMNS)
    .single();

  if (error && /creador_id|column .* does not exist/i.test(error.message)) {
    const retry = await getSupabaseAdmin()
      .from('productos')
      .update({ ...basePayload })
      .eq('id', id)
      .select(PRODUCTO_COLUMNS)
      .single();

    if (retry.error) {
      return { producto: null, error: retry.error.message };
    }

    const producto = retry.data as Producto;
    refrescarCatalogo();
    return { producto, error: null };
  }

  if (error) {
    return { producto: null, error: error.message };
  }

  refrescarCatalogo();

  return { producto: data as Producto, error: null };
}

export async function archivarProducto(id: string): Promise<{ error: string | null }> {
  if (!isSupabaseAdminConfigured()) {
    return { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local' };
  }

  if (!esUuid(id)) {
    return { error: 'ID de producto inválido' };
  }

  const { error } = await getSupabaseAdmin()
    .from('productos')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  refrescarCatalogo();
  return { error: null };
}

export async function listarProductosInactivos(): Promise<{ productos: Producto[]; error: string | null }> {
  if (!isSupabaseAdminConfigured()) {
    return { productos: [], error: 'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local' };
  }

  const { data, error } = await getSupabaseAdmin()
    .from('productos')
    .select('id, titulo, descripcion, precio, imagen_preview_url, diseno_mockup_url, archivo_r2_key, categoria, creado_en, created_at, total_ventas, status')
    .order('creado_en', { ascending: false });

  if (error) {
    const fallback = await getSupabaseAdmin().from('productos').select('id, titulo, descripcion, precio, imagen_preview_url, diseno_mockup_url, archivo_r2_key, categoria, creado_en').order('creado_en', { ascending: false });
    if (fallback.error) {
      return { productos: [], error: fallback.error.message };
    }

    return {
      productos: ((fallback.data as Producto[]) || []).map((item) => ({
        ...item,
        created_at: item.created_at ?? item.creado_en ?? null,
        total_ventas: 0,
        status: item.status ?? 'active',
      }))
        .filter((item) => {
          const createdAt = new Date(String(item.created_at ?? item.creado_en ?? Date.now()));
          const diffDays = (Date.now() - createdAt.getTime()) / 86400000;
          return diffDays > 60 && Number(item.total_ventas ?? 0) === 0;
        }),
      error: null,
    };
  }

  const productos = ((data as Producto[]) || [])
    .map((item) => ({
      ...item,
      created_at: item.created_at ?? item.creado_en ?? null,
      total_ventas: Number(item.total_ventas ?? 0),
      status: item.status ?? 'active',
    }))
    .filter((item) => {
      const createdAt = new Date(String(item.created_at ?? item.creado_en ?? Date.now()));
      const diffDays = (Date.now() - createdAt.getTime()) / 86400000;
      return String(item.status ?? 'active') !== 'archived' && diffDays > 60 && Number(item.total_ventas ?? 0) === 0;
    });

  return { productos, error: null };
}

export async function eliminarProducto(id: string): Promise<{ error: string | null }> {
  if (!isSupabaseAdminConfigured()) {
    return { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local' };
  }

  if (!esUuid(id)) {
    return { error: 'ID de producto inválido' };
  }

  const admin = getSupabaseAdmin();
  const { data: producto, error: selectError } = await admin
    .from('productos')
    .select('archivo_r2_key, diseno_mockup_url')
    .eq('id', id)
    .maybeSingle();

  if (!selectError && producto) {
    const privateKeys = [producto.archivo_r2_key].filter(Boolean) as string[];
    const mockupKey = producto.diseno_mockup_url ? extraerRutaStorage(producto.diseno_mockup_url) : null;
    if (mockupKey) {
      privateKeys.push(mockupKey);
    }

    for (const bucket of [STORAGE_BUCKET_PRIVADO, STORAGE_BUCKET_MOCKUPS]) {
      const keysDelBucket = privateKeys.filter((key) =>
        bucket === STORAGE_BUCKET_MOCKUPS ? key?.startsWith('mockups/') || key?.startsWith('mockups') : key
      );
      if (keysDelBucket.length > 0) {
        await admin.storage.from(bucket).remove(keysDelBucket).catch(() => undefined);
      }
    }
  }

  const { error } = await admin.from('productos').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  refrescarCatalogo();

  return { error: null };
}

function extraerRutaStorage(url: string) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/storage\/v1\/object\/(?:public|auth|sign)\/(?:[^/]+)\/(.+)$/);
    const key = match?.[1] ? decodeURIComponent(match[1]) : null;
    return key || null;
  } catch {
    return null;
  }
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

  const consulta = getSupabaseAdmin()
    .from('productos')
    .select(PRODUCTO_COLUMNS)
    .order('creado_en', { ascending: true });
  let { data, error } = await consulta;

  if (error && /diseno_mockup_url|column .* does not exist/i.test(error.message)) {
    const legacy = await getSupabaseAdmin()
      .from('productos')
      .select(PRODUCTO_COLUMNS_LEGACY)
      .order('creado_en', { ascending: true });
    data = legacy.data?.map((item) => ({ ...item, diseno_mockup_url: null })) ?? null;
    error = legacy.error;
  }

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
      lista.find(
        (item) =>
          String(item.diseno_mockup_url || item.imagen_preview_url || '').trim() &&
          String(item.archivo_r2_key || '').trim()
      ) ||
      lista.find((item) => String(item.diseno_mockup_url || item.imagen_preview_url || '').trim()) ||
      lista[lista.length - 1];
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
