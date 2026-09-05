import { NextResponse } from 'next/server';
import { listarCuentas } from '@/lib/cuentasBancarias';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const { cuentas, error } = await listarCuentas(true);
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 503 });
  }
  return NextResponse.json({ success: true, cuentas });
}
