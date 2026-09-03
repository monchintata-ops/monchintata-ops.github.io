function formatearMontoUsd(monto: number) {
  return `$${Number(monto).toFixed(2)}`;
}

function resumenMonto(montoUsd: number) {
  const tasa = Number(process.env.NEXT_PUBLIC_TASA_HNL || 25);
  const usd = formatearMontoUsd(montoUsd);
  if (!Number.isFinite(tasa) || tasa <= 0) return usd;
  return `${usd} / L${(Number(montoUsd) * tasa).toFixed(2)}`;
}

function escapeHtml(valor: string) {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function plantillaPagoConfirmado(params: {
  nombre?: string | null;
  producto: string;
  monto: number;
  downloadUrl?: string | null;
  minutos: number;
  ordenId: string;
  tiendaUrl?: string;
}) {
  const saludo = params.nombre?.trim() ? `Hola ${params.nombre.trim()}` : 'Hola';
  const producto = escapeHtml(params.producto);
  const monto = escapeHtml(resumenMonto(params.monto));
  const downloadUrl = params.downloadUrl?.trim() || '';
  const url = escapeHtml(downloadUrl);
  const ordenCorta = escapeHtml(params.ordenId.slice(0, 8));
  const conArchivo = Boolean(downloadUrl);

  const text = [
    `${saludo},`,
    '',
    conArchivo
      ? '¡Pago confirmado! Aquí tienes tu archivo de alta resolución.'
      : '¡Pago confirmado! Tu archivo de alta resolución estará disponible en breve.',
    '',
    `Producto: ${params.producto}`,
    `Monto: ${resumenMonto(params.monto)}`,
    `Orden: ${params.ordenId}`,
    '',
    conArchivo ? `Descarga (válida ${params.minutos} min):` : 'Aún estamos preparando el PNG de impresión. Te lo enviaremos cuando esté listo; no hay un enlace de descarga en este correo.',
    conArchivo ? downloadUrl : '',
    '',
    params.tiendaUrl ? `Tienda: ${params.tiendaUrl}` : '',
    'CreacionArte · DTF & UV-DTF',
  ]
    .filter((linea, idx, arr) => !(linea === '' && arr[idx + 1] === ''))
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pago confirmado</title>
  </head>
  <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1e293b;border:1px solid #334155;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 12px;background:#0f172a;">
                <p style="margin:0;color:#fbbf24;font-size:12px;letter-spacing:0.16em;font-weight:700;text-transform:uppercase;">CreacionArte</p>
                <h1 style="margin:10px 0 0;color:#f8fafc;font-size:24px;line-height:1.3;">¡Pago confirmado!</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 24px;color:#cbd5e1;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;color:#e2e8f0;">${escapeHtml(saludo)}, ${
                  conArchivo
                    ? 'aquí tienes tu archivo de alta resolución.'
                    : 'tu pago quedó confirmado. El archivo de alta resolución estará disponible en breve.'
                }</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 18px;color:#94a3b8;font-size:13px;">
                      <p style="margin:0 0 8px;"><strong style="color:#f8fafc;">Producto:</strong> ${producto}</p>
                      <p style="margin:0 0 8px;"><strong style="color:#f8fafc;">Monto:</strong> ${monto}</p>
                      <p style="margin:0;"><strong style="color:#f8fafc;">Orden:</strong> #${ordenCorta}</p>
                    </td>
                  </tr>
                </table>
                ${
                  conArchivo
                    ? `<p style="margin:22px 0 18px;text-align:center;">
                  <a href="${url}" style="display:inline-block;background:#f59e0b;color:#0f172a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 22px;border-radius:10px;">
                    Descargar archivo de alta resolución
                  </a>
                </p>
                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
                  El enlace caduca en ${params.minutos} minutos. Si el botón no funciona, copia esta URL:<br />
                  <a href="${url}" style="color:#fbbf24;word-break:break-all;">${url}</a>
                </p>`
                    : `<p style="margin:22px 0 0;color:#fde68a;font-size:13px;line-height:1.6;background:#0f172a;border-radius:12px;padding:14px 16px;">
                  Estamos preparando tu PNG de impresión. En cuanto esté en el servidor te lo enviaremos; este correo no incluye un enlace de descarga.
                </p>`
                }
                ${
                  params.tiendaUrl
                    ? `<p style="margin:16px 0 0;font-size:12px;"><a href="${escapeHtml(params.tiendaUrl)}" style="color:#fbbf24;">Volver a la tienda</a></p>`
                    : ''
                }
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#64748b;font-size:11px;">Diseños DTF / UV-DTF · CreacionArte</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject: `¡Pago confirmado! ${params.producto}`,
    html,
    text,
  };
}

export function plantillaPagoPendiente(params: {
  cliente: string;
  producto: string;
  monto: number;
  ordenId: string;
  banco?: string;
  comprobanteUrl?: string;
}) {
  const text = [
    `NUEVO PAGO PENDIENTE: Orden ${params.ordenId}`,
    `Cliente: ${params.cliente}`,
    `Producto: ${params.producto}`,
    `Monto: ${resumenMonto(params.monto)}`,
    params.banco ? `Banco: ${params.banco}` : '',
    params.comprobanteUrl ? `Ver comprobante: ${params.comprobanteUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#0f172a;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
    <h1 style="color:#fbbf24;font-size:18px;">Nuevo pago pendiente de verificación</h1>
    <p>Orden <strong>#${escapeHtml(params.ordenId.slice(0, 8))}</strong></p>
    <p>Cliente: ${escapeHtml(params.cliente)}<br/>Producto: ${escapeHtml(params.producto)}<br/>Monto: ${escapeHtml(resumenMonto(params.monto))}${params.banco ? `<br/>Banco: ${escapeHtml(params.banco)}` : ''}</p>
    ${
      params.comprobanteUrl
        ? `<p><a href="${escapeHtml(params.comprobanteUrl)}" style="color:#f59e0b;">Ver comprobante</a></p>`
        : ''
    }
  </body>
</html>`;

  return {
    subject: `Pago pendiente · ${params.producto}`,
    html,
    text,
  };
}
