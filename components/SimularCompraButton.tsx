'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface SimularCompraButtonProps {
  productoId: string;
  nombreArchivo?: string;
}

export default function SimularCompraButton({ productoId, nombreArchivo }: SimularCompraButtonProps) {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function simularCompraYDescargar() {
    setLoading(true);
    setError(null);
    setMensaje(null);

    try {
      const respuesta = await fetch('/api/descargar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productoId }),
      });

      const data = (await respuesta.json()) as {
        success?: boolean;
        downloadUrl?: string;
        error?: string;
      };

      if (!respuesta.ok || !data.success || !data.downloadUrl) {
        throw new Error(data.error || 'No se pudo generar el enlace de descarga');
      }

      const enlace = document.createElement('a');
      enlace.href = data.downloadUrl;
      enlace.rel = 'noopener noreferrer';
      enlace.target = '_blank';
      if (nombreArchivo) {
        enlace.download = nombreArchivo;
      }
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      setMensaje('Compra simulada. Si el navegador bloqueó la pestaña, usa el enlace firmado (válido 15 min).');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al simular la compra');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={simularCompraYDescargar}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {loading ? 'Generando enlace…' : '⚡ Simular Compra y Descargar'}
      </button>

      {mensaje && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          {mensaje}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
