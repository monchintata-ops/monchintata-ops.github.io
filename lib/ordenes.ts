import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import type { MetodoPago, Orden } from '@/lib/types';
import { esUuid } from '@/lib/uuid';

const ESTADOS_PAGADOS = new Set([
  'pagado',
  'paid',
  'completada',
  'completado',
  'entregado',
  'success',
]);

const ORDEN_COLUMNS_MIN =
  'id, producto_id, usuario_email, monto, estado_pago, transaccion_id, creado_en';

type MetaPago = {
  metodo?: MetodoPago | string;
  comprobante?: string;
  cuentaId?: string;
  nombre?: string;
  paypalId?: string;
};

function parseMeta(transaccionId?: string | null): MetaPago {
  const raw = String(transaccionId || '').trim();
  if (!raw.startsWith('{')) return {};
  try {
    return JSON.parse(raw) as MetaPago;
  } catch {
    return {};
  }
}

function mapOrden(row: Record<string, unknown>): Orden {
  const meta = parseMeta(row.transaccion_id ? String(row.transaccion_id) : null);
  return {
    id: String(row.id),
    producto_id: String(row.producto_id),
    email: String(row.usuario_email ?? row.email ?? ''),
    nombre: (row.cliente_nombre as string) || meta.nombre || null,
    monto: Number(row.monto),
    estado: String(row.estado_pago ?? row.estado ?? ''),
    transaccion_id: row.transaccion_id ? String(row.transaccion_id) : null,
    metodo_pago: (row.metodo_pago as string) || meta.metodo || null,
    comprobante_url: (row.comprobante_url as string) || meta.comprobante || null,
    cuenta_bancaria_id: (row.cuenta_bancaria_id as string) || meta.cuentaId || null,
    created_at: row.creado_en ? String(row.creado_en) : undefined,
  };
}

export function isOrdenPagada(estado: string | null | undefined) {
  return ESTADOS_PAGADOS.has(String(estado || '').toLowerCase());
}

function faltaColumna(message: string) {
  return /could not find the .* column|schema cache/i.test(message);
}

async function insertarOrden(payload: Record<string, unknown>) {
  const admin = getSupabaseAdmin();
  let intento = { ...payload };
  let { data, error } = await admin.from('ordenes').insert(intento).select('*').single();

  while (error && faltaColumna(error.message)) {
    const match = error.message.match(/'([^']+)' column/i);
    const col = match?.[1];
    if (!col || !(col in intento)) break;
    delete intento[col];
    const retry = await admin.from('ordenes').insert(intento).select('*').single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    return { orden: null as Orden | null, error: error.message };
  }

  return { orden: mapOrden(data as Record<string, unknown>), error: null };
}

export async function crearOrdenTransferencia(input: {
  productoId: string;
  email: string;
  nombre?: string;
  monto: number;
  comprobantePath: string;
  cuentaBancariaId: string;
}): Promise<{ orden: Orden | null; error: string | null }> {
  if (!isSupabaseAdminConfigured()) {
    return { orden: null, error: 'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local para registrar órdenes.' };
  }

  const meta: MetaPago = {
    metodo: 'transferencia',
    comprobante: input.comprobantePath,
    cuentaId: input.cuentaBancariaId,
    nombre: input.nombre || undefined,
  };

  return insertarOrden({
    producto_id: input.productoId,
    usuario_email: input.email,
    monto: input.monto,
    estado_pago: 'pendiente_verificacion',
    transaccion_id: JSON.stringify(meta),
    metodo_pago: 'transferencia',
    comprobante_url: input.comprobantePath,
    cuenta_bancaria_id: input.cuentaBancariaId,
    cliente_nombre: input.nombre || null,
  });
}

export async function crearOrdenPaypal(input: {
  productoId: string;
  email: string;
  nombre?: string;
  monto: number;
  paypalCaptureId: string;
}): Promise<{ orden: Orden | null; error: string | null }> {
  if (!isSupabaseAdminConfigured()) {
    return { orden: null, error: 'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local para registrar órdenes.' };
  }

  const meta: MetaPago = {
    metodo: 'paypal',
    paypalId: input.paypalCaptureId,
    nombre: input.nombre || undefined,
  };

  return insertarOrden({
    producto_id: input.productoId,
    usuario_email: input.email,
    monto: input.monto,
    estado_pago: 'completado',
    transaccion_id: JSON.stringify(meta),
    metodo_pago: 'paypal',
    cliente_nombre: input.nombre || null,
  });
}

export async function getOrdenById(id: string): Promise<Orden | null> {
  if (!isSupabaseAdminConfigured() || !esUuid(id)) {
    return null;
  }

  const { data, error } = await getSupabaseAdmin()
    .from('ordenes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapOrden(data as Record<string, unknown>);
}

export async function listarOrdenes(): Promise<{ ordenes: Orden[]; error: string | null }> {
  if (!isSupabaseAdminConfigured()) {
    return { ordenes: [], error: 'Falta SUPABASE_SERVICE_ROLE_KEY' };
  }

  const { data, error } = await getSupabaseAdmin()
    .from('ordenes')
    .select('*')
    .order('creado_en', { ascending: false });

  if (error) {
    const minimo = await getSupabaseAdmin()
      .from('ordenes')
      .select(ORDEN_COLUMNS_MIN)
      .order('creado_en', { ascending: false });
    if (minimo.error) {
      return { ordenes: [], error: minimo.error.message };
    }
    return {
      ordenes: ((minimo.data as Record<string, unknown>[]) || []).map(mapOrden),
      error: null,
    };
  }

  return {
    ordenes: ((data as Record<string, unknown>[]) || []).map(mapOrden),
    error: null,
  };
}

export async function actualizarEstadoOrden(
  id: string,
  estado: 'completado' | 'rechazado'
): Promise<{ orden: Orden | null; error: string | null }> {
  if (!isSupabaseAdminConfigured() || !esUuid(id)) {
    return { orden: null, error: 'Orden inválida' };
  }

  const { data, error } = await getSupabaseAdmin()
    .from('ordenes')
    .update({ estado_pago: estado })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    return { orden: null, error: error?.message || 'No se pudo actualizar la orden' };
  }

  return { orden: mapOrden(data as Record<string, unknown>), error: null };
}
