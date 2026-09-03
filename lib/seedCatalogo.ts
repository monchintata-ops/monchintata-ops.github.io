import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';

const TITULO_PRUEBA = '01 Local Dtf DC Shoes dorado';

export async function ensureProductoPrueba() {
  if (!isSupabaseAdminConfigured()) return;

  const admin = getSupabaseAdmin();
  const { data: existentes } = await admin
    .from('productos')
    .select('id')
    .eq('titulo', TITULO_PRUEBA)
    .limit(1);

  if (existentes?.length) {
    return;
  }

  await admin.from('productos').insert({
    titulo: TITULO_PRUEBA,
    descripcion: 'Diseño imprimible de prueba para DTF / UV-DTF.',
    precio: 2.5,
    imagen_preview_url: '/placeholder_preview.svg',
    archivo_r2_key: 'disenos/01_dc_shoes_dorado.png',
    categoria: 'Marcas & Logos',
  });
}
