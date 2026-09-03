'use client';

import { useEffect, useState } from 'react';
import { Check, ExternalLink, Loader2, X } from 'lucide-react';
import type { Orden } from '@/lib/types';

type OrdenAdmin = Orden & { producto_titulo?: string };

function esAlertaCorreoReal(mensaje?: string | null) {
  const raw = String(mensaje || '').trim();
  if (!raw) return null;
  if (/object not found|not found|no such file|does not exist/i.test(raw)) return null;
  if (/testing emails|verify a domain|domain is not verified|onboarding@resend/i.test(raw)) return null;
  return raw;
}

export default function AdminOrdenes() {
  const [ordenes, setOrdenes] = useState<OrdenAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [alertaCorreo, setAlertaCorreo] = useState<string | null>(null);
  const [resendListo, setResendListo] = useState<boolean | null>(null);

  async function cargar() {
    const respuesta = await fetch('/api/admin/ordenes');
    const data = (await respuesta.json()) as {
      success?: boolean;
      ordenes?: OrdenAdmin[];
      resendConfigurado?: boolean;
      error?: string;
    };
    if (!respuesta.ok || !data.success) {
      throw new Error(data.error || 'No se pudieron cargar las órdenes');
    }
    setOrdenes(data.ordenes || []);
    setResendListo(Boolean(data.resendConfigurado));
  }

  useEffect(() => {
    cargar().catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'));
  }, []);

  async function verComprobante(path: string) {
    const respuesta = await fetch(`/api/admin/comprobante?path=${encodeURIComponent(path)}`);
    const data = (await respuesta.json()) as { success?: boolean; url?: string; error?: string };
    if (!respuesta.ok || !data.success || !data.url) {
      setError(data.error || 'No se pudo abrir el comprobante');
      return;
    }
    window.open(data.url, '_blank', 'noopener,noreferrer');
  }

  async function decidir(orden: OrdenAdmin, accion: 'aprobar' | 'rechazar') {
    setLoading(true);
    setError(null);
    setMensaje(null);
    setAlertaCorreo(null);
    try {
      const respuesta = await fetch(`/api/admin/ordenes/${orden.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion }),
      });
      const data = (await respuesta.json()) as {
        success?: boolean;
        downloadUrl?: string | null;
        emailEnviado?: boolean;
        emailError?: string | null;
        error?: string;
      };
      if (!respuesta.ok || !data.success) throw new Error(data.error || 'No se pudo actualizar');
      await cargar();
      if (accion === 'aprobar') {
        setMensaje(
          data.emailEnviado
            ? data.downloadUrl
              ? `Pago aprobado. Correo enviado a ${orden.email} con el botón de descarga.`
              : `Pago aprobado. Correo enviado a ${orden.email}. El archivo de impresión estará disponible en breve.`
            : 'Pago aprobado. El estado quedó en completado.'
        );
        if (!data.emailEnviado) {
          const aviso = esAlertaCorreoReal(data.emailError);
          if (aviso) setAlertaCorreo(aviso);
        }
        if (data.downloadUrl) {
          await navigator.clipboard?.writeText(data.downloadUrl).catch(() => undefined);
        }
      } else {
        setMensaje('Orden rechazada.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la orden');
    } finally {
      setLoading(false);
    }
  }

  const pendientes = ordenes.filter((item) => item.estado === 'pendiente_verificacion');
  const otras = ordenes.filter((item) => item.estado !== 'pendiente_verificacion');

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Órdenes y pagos</p>
        <h2 className="text-2xl font-extrabold text-slate-100">Revisar comprobantes</h2>
        <p className="mt-1 text-sm text-slate-400">
          Aprueba la transferencia para firmar el PNG y enviarlo al email del cliente por Resend.
        </p>
        {resendListo === false && (
          <p className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Falta <code>RESEND_API_KEY</code> en <code>.env.local</code>. Puedes aprobar igual; el cliente no recibirá el correo hasta configurar Resend.
          </p>
        )}
      </div>

      {mensaje && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          {mensaje}
        </p>
      )}
      {alertaCorreo && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          {alertaCorreo}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>
      )}

      <Lista
        titulo={`Pendientes (${pendientes.length})`}
        ordenes={pendientes}
        loading={loading}
        onVer={verComprobante}
        onDecidir={decidir}
      />
      <Lista
        titulo="Historial"
        ordenes={otras}
        loading={loading}
        onVer={verComprobante}
        onDecidir={decidir}
      />
    </div>
  );
}

function Lista({
  titulo,
  ordenes,
  loading,
  onVer,
  onDecidir,
}: {
  titulo: string;
  ordenes: OrdenAdmin[];
  loading: boolean;
  onVer: (path: string) => void;
  onDecidir: (orden: OrdenAdmin, accion: 'aprobar' | 'rechazar') => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-300">{titulo}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-950/60 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Método</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Sin órdenes en esta lista.
                </td>
              </tr>
            ) : (
              ordenes.map((orden) => (
                <tr key={orden.id} className="border-t border-slate-800/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-100">{orden.nombre || orden.email}</p>
                    {orden.nombre && <p className="text-xs text-slate-500">{orden.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{orden.producto_titulo}</td>
                  <td className="px-4 py-3 text-slate-200">${Number(orden.monto).toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize text-slate-400">{orden.metodo_pago || '—'}</td>
                  <td className="px-4 py-3 text-slate-300">{orden.estado}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {orden.comprobante_url && (
                        <button
                          type="button"
                          onClick={() => onVer(orden.comprobante_url!)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-amber-500/50 hover:text-amber-400"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Comprobante
                        </button>
                      )}
                      {orden.estado === 'pendiente_verificacion' && (
                        <>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => onDecidir(orden, 'aprobar')}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10"
                          >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Aprobar pago
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => onDecidir(orden, 'rechazar')}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                          >
                            <X className="h-3.5 w-3.5" />
                            Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
