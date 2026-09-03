/** Mensaje y enlace wa.me (seguro en cliente: solo NEXT_PUBLIC_*). */

export function mensajeWhatsAppTransferencia(params: {
  ordenId: string;
  cliente: string;
  producto: string;
  monto: string;
  banco?: string;
  comprobanteUrl?: string | null;
  tiendaUrl?: string | null;
}) {
  return [
    'Hola CreacionArte, envié el comprobante de transferencia.',
    `Orden: ${params.ordenId}`,
    `Cliente: ${params.cliente}`,
    `Producto: ${params.producto}`,
    `Monto: ${params.monto}`,
    params.banco ? `Banco: ${params.banco}` : '',
    params.comprobanteUrl ? `🖼️ Comprobante: ${params.comprobanteUrl}` : '',
    params.tiendaUrl ? `Tienda: ${params.tiendaUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function construirWhatsAppUrl(mensaje: string) {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NEGOCIO || '';
  const numero = raw.replace(/[^\d]/g, '');
  if (!numero || !mensaje.trim()) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
