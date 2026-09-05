import { NextResponse } from 'next/server';
import { adminAutenticado } from '@/lib/adminAuth';
import { actualizarCuenta, crearCuenta, listarCuentas } from '@/lib/cuentasBancarias';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function noAutorizado() {
  return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
}

export async function GET() {
  if (!adminAutenticado()) return noAutorizado();
  const { cuentas, error, origen } = await listarCuentas(false);
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 503 });
  }
  return NextResponse.json({ success: true, cuentas, origen });
}

export async function POST(request: Request) {
  if (!adminAutenticado()) return noAutorizado();
  const body = (await request.json().catch(() => ({}))) as {
    banco?: string;
    numero_cuenta?: string;
    titular?: string;
    tipo_cuenta?: string;
    rtn?: string;
    activo?: boolean;
  };
  const { cuenta, error } = await crearCuenta({
    banco: String(body.banco || ''),
    numero_cuenta: String(body.numero_cuenta || ''),
    titular: String(body.titular || ''),
    tipo_cuenta: body.tipo_cuenta,
    rtn: body.rtn,
    activo: body.activo,
  });
  if (error || !cuenta) {
    return NextResponse.json({ success: false, error: error || 'No se pudo guardar' }, { status: 400 });
  }
  return NextResponse.json({ success: true, cuenta });
}

export async function PATCH(request: Request) {
  if (!adminAutenticado()) return noAutorizado();
  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    banco?: string;
    numero_cuenta?: string;
    titular?: string;
    tipo_cuenta?: string;
    rtn?: string;
    activo?: boolean;
  };
  if (!body.id) {
    return NextResponse.json({ success: false, error: 'Falta id' }, { status: 400 });
  }
  const { cuenta, error } = await actualizarCuenta(body.id, body);
  if (error || !cuenta) {
    return NextResponse.json({ success: false, error: error || 'No se pudo actualizar' }, { status: 400 });
  }
  return NextResponse.json({ success: true, cuenta });
}
