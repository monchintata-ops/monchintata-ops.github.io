'use client';

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useState } from 'react';

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

export default function PayPalPago({
  productoId,
  email,
  nombre,
  disabled,
  onError,
  onExito,
}: {
  productoId: string;
  email: string;
  nombre: string;
  disabled?: boolean;
  onError: (mensaje: string) => void;
  onExito: (data: { ordenId: string; downloadUrl: string | null }) => void;
}) {
  const [capturando, setCapturando] = useState(false);

  if (!CLIENT_ID) {
    return (
      <p className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-xs text-slate-400">
        PayPal aún no está configurado. Agrega <code className="text-slate-300">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> y{' '}
        <code className="text-slate-300">PAYPAL_CLIENT_SECRET</code> en <code className="text-slate-300">.env.local</code>.
      </p>
    );
  }

  return (
    <div className={disabled || capturando ? 'pointer-events-none opacity-60' : ''}>
      <PayPalScriptProvider options={{ clientId: CLIENT_ID, currency: 'USD', intent: 'capture' }}>
        <PayPalButtons
          style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' }}
          disabled={disabled || capturando}
          createOrder={async () => {
            const respuesta = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productoId }),
            });
            const data = (await respuesta.json()) as { success?: boolean; orderId?: string; error?: string };
            if (!respuesta.ok || !data.success || !data.orderId) {
              throw new Error(data.error || 'No se pudo crear la orden de PayPal');
            }
            return data.orderId;
          }}
          onApprove={async (data) => {
            setCapturando(true);
            try {
              const respuesta = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: data.orderID,
                  productoId,
                  email,
                  nombre,
                }),
              });
              const result = (await respuesta.json()) as {
                success?: boolean;
                ordenId?: string;
                downloadUrl?: string | null;
                error?: string;
              };
              if (!respuesta.ok || !result.success || !result.ordenId) {
                throw new Error(result.error || 'No se pudo completar el pago');
              }
              onExito({ ordenId: result.ordenId, downloadUrl: result.downloadUrl || null });
            } catch (err) {
              onError(err instanceof Error ? err.message : 'Error al capturar PayPal');
            } finally {
              setCapturando(false);
            }
          }}
          onError={() => onError('PayPal no pudo procesar el pago. Intenta de nuevo.')}
        />
      </PayPalScriptProvider>
      {capturando && <p className="mt-2 text-xs text-slate-400">Confirmando el cobro y preparando tu descarga…</p>}
    </div>
  );
}
