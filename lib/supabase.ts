import { createClient } from '@supabase/supabase-js';
import { fetchSinCache } from '@/lib/supabaseFetch';

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
}

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ''
  );
}

export function isSupabaseConfigured() {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  if (!url || !key) return false;
  if (url.includes('tu-proyecto')) return false;
  if (key.includes('tu_anon') || key.includes('tu_publishable')) return false;

  return true;
}

export const supabase = createClient(getSupabaseUrl(), getSupabaseKey(), {
  global: { fetch: fetchSinCache },
});
