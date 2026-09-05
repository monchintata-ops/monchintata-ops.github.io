import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, firmarSesionAdmin, isAdminPinConfigured, pinEsValido } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  if (!isAdminPinConfigured()) {
    return NextResponse.json(
      { success: false, error: 'ADMIN_PIN no está configurado en .env.local' },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { pin?: string };
  const pin = String(body.pin || '');

  if (!pinEsValido(pin)) {
    return NextResponse.json({ success: false, error: 'Acceso no autorizado' }, { status: 401 });
  }

  const respuesta = NextResponse.json({ success: true });
  respuesta.cookies.set({
    name: ADMIN_COOKIE,
    value: firmarSesionAdmin(),
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
  return respuesta;
}

export async function DELETE() {
  const respuesta = NextResponse.json({ success: true });
  respuesta.cookies.set({
    name: ADMIN_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return respuesta;
}
