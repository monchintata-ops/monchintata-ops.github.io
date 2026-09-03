/** Claves privadas de impresión en el bucket archivos-privados (prefijo disenos/). */
export const R2_IMPRESION_PREFIX = 'disenos/';

export function esArchivoR2KeyValida(key?: string | null): key is string {
  const valor = (key || '').trim();
  if (!valor) return false;
  if (valor.includes('..') || valor.includes('\\') || valor.includes(' ')) return false;
  return /^disenos\/[a-z0-9._-]+(?:\/[a-z0-9._-]+)*$/i.test(valor);
}
