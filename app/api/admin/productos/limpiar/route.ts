import { NextResponse } from 'next/server';
import { adminAutenticado } from '@/lib/adminAuth';
import { limpiarDuplicados } from '@/lib/adminProductos';

function noAutorizado() {
  return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
}

export async function POST() {
  if (!adminAutenticado()) {
    return noAutorizado();
  }

  const resultado = await limpiarDuplicados();
  if (resultado.error) {
    return NextResponse.json({ success: false, error: resultado.error }, { status: 503 });
  }

  return NextResponse.json({
    success: true,
    conservados: resultado.conservados,
    eliminados: resultado.eliminados,
  });
}
