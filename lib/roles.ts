import { cookies } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { adminAutenticado } from '@/lib/adminAuth';

export type PerfilRol = 'admin' | 'designer' | 'customer';
export type PerfilEstado = 'pending' | 'active' | 'suspended';

export async function obtenerPerfilActual(): Promise<{
  rol: PerfilRol;
  estado: PerfilEstado;
  max_storage_mb: number;
} | null> {
  try {
    const supabase = getSupabase();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      return null;
    }

    const { data, error } = await supabase.from('perfiles').select('rol, estado, max_storage_mb').eq('id', userId).maybeSingle();
    const perfil = (data as { rol?: string; estado?: string; max_storage_mb?: number } | null) ?? null;

    if (error || !perfil) {
      return {
        rol: 'customer',
        estado: 'pending',
        max_storage_mb: 500,
      };
    }

    return {
      rol: (perfil.rol as PerfilRol) || 'customer',
      estado: (perfil.estado as PerfilEstado) || 'pending',
      max_storage_mb: Number(perfil.max_storage_mb ?? 500),
    };
  } catch {
    return null;
  }
}

export async function usuarioAutorizadoParaSubir(): Promise<boolean> {
  if (!adminAutenticado()) {
    return false;
  }

  const perfil = await obtenerPerfilActual();
  if (!perfil) {
    return false;
  }

  return (perfil.rol === 'admin' || perfil.rol === 'designer') && perfil.estado === 'active';
}

export function perfilAutorizadoParaSubirSinSesion(): boolean {
  return false;
}

export function getCurrentUserId(): string | null {
  try {
    const cookieStore = cookies();
    const authCookie = cookieStore.get('sb-auth-token') ?? cookieStore.get('sb-access-token');
    const raw = authCookie?.value || '';
    return raw ? 'authenticated-user' : null;
  } catch {
    return null;
  }
}
