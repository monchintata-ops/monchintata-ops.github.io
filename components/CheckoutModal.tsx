'use client';

import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { Building2, Download, Loader2, MessageCircle, X } from 'lucide-react';
import type { CuentaBancaria } from '@/lib/types';
import { construirWhatsAppUrl, mensajeWhatsAppTransferencia } from '@/lib/whatsapp';

const PayPalPago = dynamic(() => import('@/components/PayPalPago'), { ssr: false });

const EMAIL_DOMINIOS = ['@gmail.com', '@hotmail.com', '@outlook.com'] as const;

interface CheckoutProducto {
  id: string;
  titulo: string;
  precio: number;
}

interface CheckoutModalProps {
  producto?: CheckoutProducto | null;
  productoId?: string;
  nombreArchivo?: string;
  open?: boolean;
  onClose?: () => void;
}

type Metodo = 'transferencia' | 'paypal';

function dispararDescarga(url: string, nombreArchivo?: string) {
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.rel = 'noopener noreferrer';
  enlace.target = '_blank';
  if (nombreArchivo) {
    enlace.download = nombreArchivo;
  }
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}

function montoVisible(precio: number) {
  const tasa = Number(process.env.NEXT_PUBLIC_TASA_HNL || 25);
  const usd = `$${Number(precio).toFixed(2)}`;
  if (!Number.isFinite(tasa) || tasa <= 0) return usd;
  return `${usd} / L${(Number(precio) * tasa).toFixed(2)}`;
}

function nombrePng(titulo: string) {
  return `${titulo.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'diseno'}.png`;
}

function aplicarDominioEmail(valor: string, dominio: string) {
  const recortado = valor.trim();
  if (recortado.includes('@')) return recortado;
  const local = recortado.replace(/\s+/g, '');
  if (!local) return recortado;
  return `${local}${dominio}`;
}

export default function CheckoutModal({
  producto: productoProp,
  productoId: productoIdProp,
  nombreArchivo,
  open: openProp,
  onClose,
}: CheckoutModalProps) {
  const [internoAbierto, setInternoAbierto] = useState(false);
  const controlado = typeof openProp === 'boolean';
  const abierto = controlado ? openProp : internoAbierto;
  const tituloId = useId();
  const productoFijo = Boolean(productoProp?.id || productoIdProp);

  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [catalogo, setCatalogo] = useState<CheckoutProducto[]>(productoProp ? [productoProp] : []);
  const [productoId, setProductoId] = useState(productoProp?.id || productoIdProp || '');
  const [metodo, setMetodo] = useState<Metodo>('transferencia');
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [cuentaId, setCuentaId] = useState('');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const producto = useMemo(
    () => catalogo.find((item) => item.id === productoId) || productoProp || null,
    [catalogo, productoId, productoProp]
  );
  const cuenta = cuentas.find((item) => item.id === cuentaId) || cuentas[0] || null;
  const archivoDescarga = nombreArchivo || (producto ? nombrePng(producto.titulo) : undefined);

  function cerrar() {
    if (loading) return;
    setError(null);
    if (controlado) {
      onClose?.();
    } else {
      setInternoAbierto(false);
    }
  }

  useEffect(() => {
    if (!abierto) return;
    let cancelado = false;

    fetch('/api/cuentas-bancarias')
      .then((res) => res.json())
      .then((data: { success?: boolean; cuentas?: CuentaBancaria[] }) => {
        if (cancelado || !data.success) return;
        const lista = data.cuentas || [];
        setCuentas(lista);
        setCuentaId((prev) => prev || lista[0]?.id || '');
      })
      .catch(() => undefined);

    fetch('/api/productos')
      .then((res) => res.json())
      .then((data: { success?: boolean; productos?: CheckoutProducto[] }) => {
        if (cancelado || !data.success) return;
        const lista = data.productos || [];
        setCatalogo((prev) => {
          const mapa = new Map(lista.map((item) => [item.id, item]));
          for (const item of prev) mapa.set(item.id, item);
          if (productoProp) mapa.set(productoProp.id, productoProp);
          return Array.from(mapa.values());
        });
        setProductoId((prev) => prev || productoProp?.id || productoIdProp || '');
      })
      .catch(() => undefined);

    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape' || loading) return;
      if (controlado) onClose?.();
      else setInternoAbierto(false);
    }
    window.addEventListener('keydown', onKey);
    return () => {
      cancelado = true;
      window.removeEventListener('keydown', onKey);
    };
  }, [abierto, controlado, loading, onClose, productoIdProp, productoProp]);

  async function enviarTransferencia(event: FormEvent) {
    event.preventDefault();
    if (!producto) {
      setError('Selecciona el diseño que deseas comprar.');
      return;
    }
    if (!cuenta) {
      setError('No hay cuentas bancarias activas. Configúralas en /admin.');
      return;
    }
    if (!comprobante) {
      setError('Adjunta la captura o el PDF del comprobante.');
      return;
    }

    setLoading(true);
    setError(null);
    setExito(null);
    setWhatsappUrl(null);
    setDownloadUrl(null);

    try {
      const cuerpo = new FormData();
      cuerpo.append('productoId', producto.id);
      cuerpo.append('cuentaId', cuenta.id);
      cuerpo.append('email', email);
      cuerpo.append('nombre', nombre);
      cuerpo.append('comprobante', comprobante);

      const respuesta = await fetch('/api/ordenes/transferencia', { method: 'POST', body: cuerpo });
      const data = (await respuesta.json()) as {
        success?: boolean;
        ordenId?: string;
        error?: string;
        whatsappUrl?: string | null;
        comprobanteUrl?: string | null;
        tiendaUrl?: string | null;
        mensaje?: string;
      };
      if (!respuesta.ok || !data.success || !data.ordenId) {
        throw new Error(data.error || 'No se pudo registrar la transferencia');
      }

      const siteUrl = window.location.origin;
      const comprobanteCorto = `${siteUrl}/api/comprobante/${data.ordenId}`;
      const mensajeWa = mensajeWhatsAppTransferencia({
        ordenId: data.ordenId,
        cliente: nombre.trim() || email,
        producto: producto.titulo,
        monto: montoVisible(producto.precio),
        banco: cuenta.banco,
        comprobanteUrl: comprobanteCorto,
        tiendaUrl: data.tiendaUrl || `${window.location.origin}/producto/${producto.id}`,
      });
      setWhatsappUrl(construirWhatsAppUrl(mensajeWa) || data.whatsappUrl || null);
      setExito(data.mensaje || `Orden ${data.ordenId} registrada. Revisaremos tu comprobante.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el comprobante');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {!controlado && (
        <button
          type="button"
          onClick={() => setInternoAbierto(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
        >
          <Download className="h-4 w-4" />
          Comprar y descargar
        </button>
      )}

      {abierto && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-x-hidden bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={cerrar}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            className="modal-shell max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Checkout</p>
                <h2 id={tituloId} className="mt-1 break-words text-xl font-bold text-slate-100">
                  {producto?.titulo || 'Elige un diseño'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Total:{' '}
                  <span className="font-semibold text-slate-100">
                    {producto ? montoVisible(producto.precio) : '—'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {downloadUrl ? (
              <div className="space-y-3">
                <p className="break-words rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {exito || 'Pago confirmado. Tu archivo está listo.'}
                </p>
                <button
                  type="button"
                  onClick={() => dispararDescarga(downloadUrl, archivoDescarga)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400"
                >
                  <Download className="h-4 w-4" />
                  Descargar PNG
                </button>
              </div>
            ) : exito ? (
              <div className="space-y-2">
                <p className="break-words rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                  {exito}
                </p>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar comprobante por WhatsApp al equipo
                  </a>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodo('transferencia')}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                      metodo === 'transferencia'
                        ? 'bg-amber-500 text-slate-950'
                        : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Transferencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodo('paypal')}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                      metodo === 'paypal'
                        ? 'bg-amber-500 text-slate-950'
                        : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    PayPal
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm" htmlFor="email">
                    <span className="text-slate-400">Email</span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
                      placeholder="tucorreo@email.com"
                    />
                  </label>
                  <div className="flex min-w-0 flex-wrap gap-1.5">
                    {EMAIL_DOMINIOS.map((dominio) => (
                      <button
                        key={dominio}
                        type="button"
                        onClick={() => setEmail((prev) => aplicarDominioEmail(prev, dominio))}
                        className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:border-amber-500/50 hover:text-amber-400"
                      >
                        {dominio}
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm">
                    <span className="text-slate-400">Diseño</span>
                    <select
                      required
                      value={productoId}
                      disabled={productoFijo && Boolean(producto)}
                      onChange={(event) => setProductoId(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      {!productoFijo && (
                        <option value="">Selecciona un diseño</option>
                      )}
                      {catalogo.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.titulo} · {montoVisible(item.precio)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="text-slate-400">Tu nombre (opcional)</span>
                    <input
                      type="text"
                      name="name"
                      value={nombre}
                      onChange={(event) => setNombre(event.target.value)}
                      autoComplete="name"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
                      placeholder="Cómo aparece en la orden"
                    />
                  </label>
                </div>

                {metodo === 'transferencia' ? (
                  <form onSubmit={enviarTransferencia} className="mt-4 space-y-3">
                    {cuentas.length === 0 ? (
                      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                        Aún no hay cuentas bancarias publicadas. Agrégalas en Admin → Cuentas Bancarias.
                      </p>
                    ) : (
                      <>
                        <label className="block text-sm">
                          <span className="text-slate-400">Banco</span>
                          <select
                            value={cuentaId}
                            onChange={(event) => setCuentaId(event.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
                          >
                            {cuentas.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.banco} · {item.tipo_cuenta || 'Cuenta'}
                              </option>
                            ))}
                          </select>
                        </label>
                        {cuenta && (
                          <div className="overflow-hidden break-words rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-xs text-slate-300">
                            <p className="flex items-center gap-2 font-semibold text-slate-100">
                              <Building2 className="h-3.5 w-3.5 text-amber-400" />
                              {cuenta.banco}
                            </p>
                            <p className="mt-2">Cuenta: {cuenta.numero_cuenta}</p>
                            <p>Titular: {cuenta.titular}</p>
                            {cuenta.tipo_cuenta && <p>Tipo: {cuenta.tipo_cuenta}</p>}
                            {cuenta.rtn && <p>RTN: {cuenta.rtn}</p>}
                          </div>
                        )}
                      </>
                    )}

                    <label className="block text-sm">
                      <span className="text-slate-400">Comprobante (.jpg / .png / .pdf)</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(event) => setComprobante(event.target.files?.[0] || null)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-1 file:text-xs file:font-bold file:text-slate-950"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={loading || cuentas.length === 0 || !producto}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-70"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      {loading ? 'Enviando orden…' : 'Enviar orden y comprobante'}
                    </button>
                  </form>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-slate-500">
                      Completa el email y paga con PayPal. Al aprobarse el cobro se desbloquea la descarga inmediata.
                    </p>
                    {producto ? (
                      <PayPalPago
                        productoId={producto.id}
                        email={email}
                        nombre={nombre}
                        disabled={!email.includes('@')}
                        onError={(mensaje) => setError(mensaje || null)}
                        onExito={({ ordenId, downloadUrl: url }) => {
                          setExito(`Pago confirmado. Orden ${ordenId}.`);
                          setDownloadUrl(url);
                          if (url) dispararDescarga(url, archivoDescarga);
                        }}
                      />
                    ) : (
                      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                        Selecciona un diseño para pagar con PayPal.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            {error && (
              <p className="mt-3 break-words rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
