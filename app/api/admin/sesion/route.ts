import { NextResponse } from 'next/server';
import { adminAutenticado } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  if (!adminAutenticado()) {
    return NextResponse.json({ success: false, autenticado: false }, { status: 401 });
  }

  return NextResponse.json({ success: true, autenticado: true });
}
