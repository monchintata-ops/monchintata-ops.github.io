import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE } from '@/lib/adminConstants';

export { ADMIN_COOKIE } from '@/lib/adminConstants';

function getAdminPin() {
  return process.env.ADMIN_PIN?.trim() || '';
}

export function isAdminPinConfigured() {
  const pin = getAdminPin();
  return Boolean(pin && pin !== 'tu_clave_secreta');
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function pinEsValido(pinIngresado: string) {
  const esperado = getAdminPin();
  if (!esperado || esperado === 'tu_clave_secreta') {
    return false;
  }
  return safeEqual(pinIngresado, esperado);
}

export function firmarSesionAdmin() {
  const secreto = getAdminPin();
  const payload = String(Date.now());
  const firma = createHmac('sha256', secreto).update(payload).digest('hex');
  return `${payload}.${firma}`;
}

export function sesionAdminValida(token?: string | null) {
  if (!token || !token.includes('.')) return false;
  const secreto = getAdminPin();
  if (!secreto) return false;

  const [payload, firma] = token.split('.');
  if (!payload || !firma) return false;

  const esperada = createHmac('sha256', secreto).update(payload).digest('hex');
  return safeEqual(firma, esperada);
}

export function leerSesionAdmin() {
  return cookies().get(ADMIN_COOKIE)?.value;
}

export function adminAutenticado() {
  return sesionAdminValida(leerSesionAdmin());
}
