'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Lock, LogOut } from 'lucide-react';
import AdminCatalogo from '@/components/AdminCatalogo';
import AdminCuentas from '@/components/AdminCuentas';
import AdminOrdenes from '@/components/AdminOrdenes';
import { ADMIN_SESSION_KEY } from '@/lib/adminConstants';
import type { Producto } from '@/lib/types';

type TabAdmin = 'catalogo' | 'cuentas' | 'ordenes';

export default function AdminGate() {
  const [listo, setListo] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null);
  const [tab, setTab] = useState<TabAdmin>('catalogo');

  async function cargarCatalogo() {
    const respuesta = await fetch('/api/admin/productos');
    const data = (await respuesta.json()) as {
      success?: boolean;
      productos?: Producto[];
      error?: string;
    };

    if (!respuesta.ok || !data.success) {
      throw new Error(data.error || 'Acceso no autorizado');
    }

    setProductos(data.productos || []);
    setErrorCatalogo(null);
  }

  useEffect(() => {
    let cancelado = false;

    async function restaurar() {
      const local = sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
      const sesion = await fetch('/api/admin/sesion');
      const ok = sesion.ok || local;

      if (ok && sesion.ok) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
        try {
          await cargarCatalogo();
          if (!cancelado) setAutenticado(true);
        } catch {
          sessionStorage.removeItem(ADMIN_SESSION_KEY);
          if (!cancelado) setAutenticado(false);
        }
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        if (!cancelado) setAutenticado(false);
      }

      if (!cancelado) setListo(true);
    }

    restaurar();
    return () => {
      cancelado = true;
    };
  }, []);

  async function entrar(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const respuesta = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = (await respuesta.json()) as { success?: boolean; error?: string };

      if (!respuesta.ok || !data.success) {
        throw new Error(data.error || 'Acceso no autorizado');
      }

      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      await cargarCatalogo();
      setAutenticado(true);
      setPin('');
    } catch (err) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      setError(err instanceof Error ? err.message : 'Acceso no autorizado');
    } finally {
      setLoading(false);
    }
  }

  async function cerrarSesion() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAutenticado(false);
    setProductos([]);
  }

  if (!listo) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!autenticado) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <form
          onSubmit={entrar}
          className="modal-shell w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
        >
          <div className="mb-4 flex items-center gap-2 text-amber-400">
            <Lock className="h-5 w-5" />
            <p className="text-xs font-semibold uppercase tracking-wider">Acceso restringido</p>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Panel de administración</h1>
          <p className="mt-1 text-sm text-slate-400">Ingresa el PIN de administrador para continuar.</p>

          <label className="mt-5 block text-sm">
            <span className="text-slate-400">PIN / Contraseña</span>
            <input
              type="password"
              required
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
              placeholder="ADMIN_PIN"
              autoComplete="current-password"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Entrar
          </button>

          {error && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['catalogo', 'Catálogo'],
              ['cuentas', 'Cuentas Bancarias'],
              ['ordenes', 'Órdenes y Pagos'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                tab === id
                  ? 'bg-amber-500 text-slate-950'
                  : 'border border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={cerrarSesion}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-amber-500/40 hover:text-amber-400"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión Admin
        </button>
      </div>
      {tab === 'catalogo' && (
        <AdminCatalogo productosIniciales={productos} errorInicial={errorCatalogo} />
      )}
      {tab === 'cuentas' && <AdminCuentas />}
      {tab === 'ordenes' && <AdminOrdenes />}
    </div>
  );
}
