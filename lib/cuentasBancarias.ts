import { randomUUID } from 'crypto';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import { descargarArchivoPrivado, subirArchivoPrivado } from '@/lib/storagePrivado';
import type { CuentaBancaria } from '@/lib/types';

const STORAGE_PATH = 'config/cuentas-bancarias.json';
const COLUMNS = 'id, banco, numero_cuenta, titular, tipo_cuenta, rtn, activo, creado_en';

function usaTabla(errorMessage?: string) {
  return !errorMessage || !/could not find the table|schema cache|does not exist/i.test(errorMessage);
}

async function leerStorage(): Promise<CuentaBancaria[]> {
  try {
    const archivo = await descargarArchivoPrivado(STORAGE_PATH);
    const parsed = JSON.parse(new TextDecoder().decode(archivo.bytes)) as CuentaBancaria[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function escribirStorage(cuentas: CuentaBancaria[]) {
  await subirArchivoPrivado({
    path: STORAGE_PATH,
    body: Buffer.from(JSON.stringify(cuentas, null, 2)),
    contentType: 'application/json',
    upsert: true,
  });
}

export async function listarCuentas(soloActivas = false): Promise<{
  cuentas: CuentaBancaria[];
  error: string | null;
  origen: 'tabla' | 'storage';
}> {
  if (!isSupabaseAdminConfigured()) {
    return { cuentas: [], error: 'Falta SUPABASE_SERVICE_ROLE_KEY', origen: 'storage' };
  }

  const { data, error } = await getSupabaseAdmin()
    .from('cuentas_bancarias')
    .select(COLUMNS)
    .order('banco', { ascending: true });

  if (!error) {
    const cuentas = ((data as CuentaBancaria[]) || []).filter((item) => (soloActivas ? item.activo : true));
    return { cuentas, error: null, origen: 'tabla' };
  }

  if (!usaTabla(error.message)) {
    const cuentas = (await leerStorage()).filter((item) => (soloActivas ? item.activo : true));
    return { cuentas, error: null, origen: 'storage' };
  }

  return { cuentas: [], error: error.message, origen: 'tabla' };
}

export async function crearCuenta(input: {
  banco: string;
  numero_cuenta: string;
  titular: string;
  tipo_cuenta?: string;
  rtn?: string;
  activo?: boolean;
}): Promise<{ cuenta: CuentaBancaria | null; error: string | null }> {
  const payload = {
    banco: input.banco.trim(),
    numero_cuenta: input.numero_cuenta.trim(),
    titular: input.titular.trim(),
    tipo_cuenta: input.tipo_cuenta?.trim() || null,
    rtn: input.rtn?.trim() || null,
    activo: input.activo !== false,
  };

  if (!payload.banco || !payload.numero_cuenta || !payload.titular) {
    return { cuenta: null, error: 'Banco, número de cuenta y titular son obligatorios' };
  }

  const { data, error } = await getSupabaseAdmin()
    .from('cuentas_bancarias')
    .insert(payload)
    .select(COLUMNS)
    .single();

  if (!error) {
    return { cuenta: data as CuentaBancaria, error: null };
  }

  if (!usaTabla(error.message)) {
    const cuentas = await leerStorage();
    const cuenta: CuentaBancaria = {
      id: randomUUID(),
      ...payload,
      creado_en: new Date().toISOString(),
    };
    cuentas.push(cuenta);
    await escribirStorage(cuentas);
    return { cuenta, error: null };
  }

  return { cuenta: null, error: error.message };
}

export async function actualizarCuenta(
  id: string,
  input: Partial<{
    banco: string;
    numero_cuenta: string;
    titular: string;
    tipo_cuenta: string;
    rtn: string;
    activo: boolean;
  }>
): Promise<{ cuenta: CuentaBancaria | null; error: string | null }> {
  const { data, error } = await getSupabaseAdmin()
    .from('cuentas_bancarias')
    .update({
      ...(input.banco !== undefined ? { banco: input.banco.trim() } : {}),
      ...(input.numero_cuenta !== undefined ? { numero_cuenta: input.numero_cuenta.trim() } : {}),
      ...(input.titular !== undefined ? { titular: input.titular.trim() } : {}),
      ...(input.tipo_cuenta !== undefined ? { tipo_cuenta: input.tipo_cuenta.trim() || null } : {}),
      ...(input.rtn !== undefined ? { rtn: input.rtn.trim() || null } : {}),
      ...(input.activo !== undefined ? { activo: input.activo } : {}),
    })
    .eq('id', id)
    .select(COLUMNS)
    .single();

  if (!error) {
    return { cuenta: data as CuentaBancaria, error: null };
  }

  if (!usaTabla(error.message)) {
    const cuentas = await leerStorage();
    const idx = cuentas.findIndex((item) => item.id === id);
    if (idx < 0) return { cuenta: null, error: 'Cuenta no encontrada' };
    cuentas[idx] = {
      ...cuentas[idx],
      ...(input.banco !== undefined ? { banco: input.banco.trim() } : {}),
      ...(input.numero_cuenta !== undefined ? { numero_cuenta: input.numero_cuenta.trim() } : {}),
      ...(input.titular !== undefined ? { titular: input.titular.trim() } : {}),
      ...(input.tipo_cuenta !== undefined ? { tipo_cuenta: input.tipo_cuenta.trim() || null } : {}),
      ...(input.rtn !== undefined ? { rtn: input.rtn.trim() || null } : {}),
      ...(input.activo !== undefined ? { activo: input.activo } : {}),
    };
    await escribirStorage(cuentas);
    return { cuenta: cuentas[idx], error: null };
  }

  return { cuenta: null, error: error.message };
}

export async function obtenerCuenta(id: string): Promise<CuentaBancaria | null> {
  const { cuentas } = await listarCuentas(false);
  return cuentas.find((item) => item.id === id) || null;
}
