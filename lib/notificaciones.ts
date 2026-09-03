import { Resend } from 'resend';
import { EMAIL_RE } from '@/lib/types';

export function formatearMontoUsd(monto: number) {
  return `$${Number(monto).toFixed(2)}`;
}

export function montoEnLempiras(montoUsd: number) {
  const tasa = Number(process.env.NEXT_PUBLIC_TASA_HNL || 25);
  if (!Number.isFinite(tasa) || tasa <= 0) return null;
  return `L${(Number(montoUsd) * tasa).toFixed(2)}`;
}

export function resumenMonto(montoUsd: number) {
  const hnl = montoEnLempiras(montoUsd);
  return hnl ? `${formatearMontoUsd(montoUsd)} / ${hnl}` : formatearMontoUsd(montoUsd);
}

export function whatsappEmpresaUrl(mensaje: string) {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NEGOCIO || process.env.WHATSAPP_NEGOCIO || '';
  const numero = raw.replace(/[^\d]/g, '');
  if (!numero || !mensaje.trim()) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function resendConfigurado() {
  const key = process.env.RESEND_API_KEY?.trim() || '';
  return Boolean(key && key.startsWith('re_') && !key.includes('tu_api_key'));
}

const REMITENTE_PRODUCCION = 'CreacionArte <noreply@creacionarte.hn>';

function emailDeRemitente(raw: string) {
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] || raw).trim();
}

/** Resend exige un correo completo (noreply@dominio), no solo el dominio. */
function remitente() {
  const raw = process.env.EMAIL_FROM?.trim() || '';
  let email = emailDeRemitente(raw);
  if (email && !email.includes('@') && /\./.test(email)) {
    email = `noreply@${email}`;
  }
  if (!EMAIL_RE.test(email) || /onboarding@resend\.dev/i.test(email)) {
    return REMITENTE_PRODUCCION;
  }
  const nombre = raw.match(/^([^<]+)</)?.[1]?.trim() || 'CreacionArte';
  return `${nombre} <${email}>`;
}

function esErrorResendDeDominio(mensaje?: string | null) {
  return /testing emails|verify a domain|domain is not verified|onboarding@resend/i.test(
    String(mensaje || '')
  );
}

export async function enviarCorreo(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ enviado: boolean; error?: string }> {
  if (!resendConfigurado()) {
    console.info(`[notificaciones] Correo no enviado (sin RESEND_API_KEY): ${params.subject} → ${params.to}`);
    return { enviado: false, error: 'RESEND_API_KEY no configurado' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY!.trim());
    const { error } = await resend.emails.send({
      from: remitente(),
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    if (error) {
      const detalle = error.message || 'Error al enviar correo con Resend';
      if (esErrorResendDeDominio(detalle)) {
        console.warn(`[notificaciones] Remitente inválido o dominio Resend pendiente: ${detalle}`);
        return { enviado: false };
      }
      return { enviado: false, error: detalle };
    }
    return { enviado: true };
  } catch (error) {
    const detalle = error instanceof Error ? error.message : 'Error al enviar correo';
    if (esErrorResendDeDominio(detalle)) {
      console.warn(`[notificaciones] Remitente inválido o dominio Resend pendiente: ${detalle}`);
      return { enviado: false };
    }
    return { enviado: false, error: detalle };
  }
}

export function emailEmpresa() {
  const raw = process.env.EMAIL_NOTIFICACIONES?.trim() || process.env.EMAIL_EMPRESA?.trim() || '';
  const match = raw.match(/<([^>]+)>/);
  const email = (match?.[1] || raw).trim();
  return EMAIL_RE.test(email) ? email : '';
}
