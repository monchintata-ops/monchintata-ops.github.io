import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'El pago simulado ya no está disponible. Usa transferencia bancaria o PayPal en el checkout.',
    },
    { status: 410 }
  );
}
