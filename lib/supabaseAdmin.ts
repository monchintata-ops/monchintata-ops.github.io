import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { fetchSinCache } from '@/lib/supabaseFetch';

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
}

export function isSupabaseAdminConfigured() {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  return Boolean(url && key && !url.includes('tu-proyecto') && !key.includes('tu_service'));
}

let admin: SupabaseClient | null = null;

/** Solo usar en Route Handlers / servidor. Nunca importar desde componentes cliente. */
export function getSupabaseAdmin(): SupabaseClient {
  if (!admin) {
    admin = createClient(getSupabaseUrl(), getServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetchSinCache },
    });
  }
  return admin;
}
