import { NextResponse } from 'next/server';
import { obtenerCuenta } from '@/lib/cuentasBancarias';
import { plantillaPagoPendiente } from '@/lib/emails/pagoConfirmado';
import {
  emailEmpresa,
  enviarCorreo,
  resumenMonto,
  whatsappEmpresaUrl,
} from '@/lib/notificaciones';
import { mensajeWhatsAppTransferencia } from '@/lib/whatsapp';
import { crearOrdenTransferencia } from '@/lib/ordenes';
import { getProductoById } from '@/lib/productos';
import { urlAbsoluta, urlComprobantePublico } from '@/lib/siteUrl';
import { subirArchivoPrivado } from '@/lib/storagePrivado';
import { EMAIL_RE } from '@/lib/types';
import { esUuid } from '@/lib/uuid';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024;
const EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'];
const MIMES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

function nombreSeguro(nombre: string) {
  const base = nombre.split(/[/\\]/).pop() || 'comprobante';
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'comprobante'
  );
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const productoId = String(form.get('productoId') || '');
    const cuentaId = String(form.get('cuentaId') || '');
    const email = String(form.get('email') || '').trim().toLowerCase();
    const nombre = String(form.get('nombre') || '').trim();
    const archivo = form.get('comprobante');

    if (!esUuid(productoId)) {
      return NextResponse.json({ success: false, error: 'productoId inválido' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: 'Indica un email válido' }, { status: 400 });
    }
    if (!esUuid(cuentaId)) {
      return NextResponse.json({ success: false, error: 'Selecciona una cuenta bancaria' }, { status: 400 });
    }
    if (!(archivo instanceof File)) {
      return NextResponse.json({ success: false, error: 'Adjunta el comprobante de transferencia' }, { status: 400 });
    }
    if (archivo.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'El comprobante supera 8 MB' }, { status: 400 });
    }

    const nombreArchivo = nombreSeguro(archivo.name);
    const ext = nombreArchivo.includes('.') ? `.${nombreArchivo.split('.').pop()}` : '';
    if (!EXTS.includes(ext) && !MIMES.includes(archivo.type)) {
      return NextResponse.json(
        { success: false, error: 'Formato de comprobante no permitido (jpg, png, webp o pdf)' },
        { status: 400 }
      );
    }

    const producto = await getProductoById(productoId);
    if (!producto) {
      return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
    }

    const cuenta = await obtenerCuenta(cuentaId);
    if (!cuenta || !cuenta.activo) {
      return NextResponse.json({ success: false, error: 'La cuenta bancaria no está disponible' }, { status: 400 });
    }

    const path = `comprobantes/${Date.now()}-${nombreArchivo}`;
    await subirArchivoPrivado({
      path,
      body: Buffer.from(await archivo.arrayBuffer()),
      contentType: archivo.type || 'application/octet-stream',
    });

    const { orden, error } = await crearOrdenTransferencia({
      productoId,
      email,
      nombre: nombre || undefined,
      monto: Number(producto.precio),
      comprobantePath: path,
      cuentaBancariaId: cuentaId,
    });

    if (error || !orden) {
      return NextResponse.json(
        { success: false, error: error || 'No se pudo registrar la orden' },
        { status: 503 }
      );
    }

    const tiendaUrl = urlAbsoluta(`/producto/${producto.id}`);
    const comprobanteCorto = urlComprobantePublico(orden.id);
    const mensajeWhatsapp = mensajeWhatsAppTransferencia({
      ordenId: orden.id,
      cliente: nombre || email,
      producto: producto.titulo,
      monto: resumenMonto(Number(producto.precio)),
      banco: cuenta.banco,
      comprobanteUrl: comprobanteCorto,
      tiendaUrl,
    });

    const destino = emailEmpresa();
    if (destino) {
      const plantilla = plantillaPagoPendiente({
        cliente: nombre || email,
        producto: producto.titulo,
        monto: Number(producto.precio),
        ordenId: orden.id,
        banco: `${cuenta.banco} · ${cuenta.numero_cuenta}`,
        comprobanteUrl: comprobanteCorto,
      });
      await enviarCorreo({
        to: destino,
        subject: plantilla.subject,
        text: plantilla.text,
        html: plantilla.html,
      });
    }

    return NextResponse.json({
      success: true,
      ordenId: orden.id,
      estado: orden.estado,
      comprobanteUrl: comprobanteCorto,
      tiendaUrl,
      whatsappUrl: whatsappEmpresaUrl(mensajeWhatsapp),
      mensaje: 'Orden registrada. Queda pendiente de verificación del comprobante.',
    });
  } catch (error) {
    console.error('Error en transferencia:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al registrar la transferencia',
      },
      { status: 500 }
    );
  }
}
