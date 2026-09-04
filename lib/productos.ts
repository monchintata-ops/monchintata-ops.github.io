import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { ensureProductoPrueba } from '@/lib/seedCatalogo';
import type { Producto } from '@/lib/types';
import { esUuid } from '@/lib/uuid';

const PRODUCTO_LIST_COLUMNS =
  'id, titulo, descripcion, precio, imagen_preview_url, diseno_mockup_url, archivo_r2_key, categoria, creado_en';
const PRODUCTO_LIST_COLUMNS_LEGACY =
  'id, titulo, descripcion, precio, imagen_preview_url, archivo_r2_key, categoria, creado_en';

function clienteCatalogo() {
  // En el servidor usamos service role para no chocar con RLS del catálogo público.
  return isSupabaseAdminConfigured() ? getSupabaseAdmin() : supabase;
}

export async function getProductos(): Promise<{ productos: Producto[]; error: string | null }> {
  if (!isSupabaseConfigured() && !isSupabaseAdminConfigured()) {
    return {
      productos: [],
      error: 'Supabase no está configurado. Completa las credenciales en .env.local.',
    };
  }

  const consulta = clienteCatalogo()
    .from('productos')
    .select(PRODUCTO_LIST_COLUMNS)
    .order('titulo', { ascending: true });
  let { data, error } = await consulta;

  if (error && /diseno_mockup_url|column .* does not exist/i.test(error.message)) {
    const legacy = await clienteCatalogo()
      .from('productos')
      .select(PRODUCTO_LIST_COLUMNS_LEGACY)
      .order('titulo', { ascending: true });
    data = legacy.data?.map((item) => ({ ...item, diseno_mockup_url: null })) ?? null;
    error = legacy.error;
  }

  if (error) {
    return { productos: [], error: error.message };
  }

  if (!data?.length) {
    await ensureProductoPrueba();
    const segundo = await clienteCatalogo()
      .from('productos')
      .select(PRODUCTO_LIST_COLUMNS)
      .order('titulo', { ascending: true });

    if (segundo.error) {
      return { productos: [], error: segundo.error.message };
    }

    return { productos: (segundo.data as Producto[]) ?? [], error: null };
  }

  return { productos: (data as Producto[]) ?? [], error: null };
}

export async function getProductoDetalle(
  id: string
): Promise<{ producto: Producto | null; error: string | null }> {
  if (!isSupabaseConfigured() && !isSupabaseAdminConfigured()) {
    return {
      producto: null,
      error: 'Supabase no está configurado. Completa las credenciales en .env.local.',
    };
  }

  if (!esUuid(id)) {
    return { producto: null, error: null };
  }

  const { data, error } = await clienteCatalogo()
    .from('productos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (/invalid input syntax for type uuid/i.test(error.message)) {
      return { producto: null, error: null };
    }
    return { producto: null, error: error.message };
  }

  return { producto: (data as Producto | null) ?? null, error: null };
}

export async function getProductoById(id: string): Promise<Producto | null> {
  const { producto } = await getProductoDetalle(id);
  return producto;
}
