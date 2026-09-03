'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Plus, Save } from 'lucide-react';
import type { CuentaBancaria } from '@/lib/types';

const VACIO = {
  banco: '',
  numero_cuenta: '',
  titular: '',
  tipo_cuenta: 'Ahorro',
  rtn: '',
};

export default function AdminCuentas() {
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [form, setForm] = useState(VACIO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [origen, setOrigen] = useState<'tabla' | 'storage' | null>(null);

  async function cargar() {
    const respuesta = await fetch('/api/admin/cuentas');
    const data = (await respuesta.json()) as {
      success?: boolean;
      cuentas?: CuentaBancaria[];
      origen?: 'tabla' | 'storage';
      error?: string;
    };
    if (!respuesta.ok || !data.success) {
      throw new Error(data.error || 'No se pudieron cargar las cuentas');
    }
    setCuentas(data.cuentas || []);
    setOrigen(data.origen || null);
  }

  useEffect(() => {
    cargar().catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar'));
  }, []);

  async function guardar(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const respuesta = await fetch('/api/admin/cuentas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await respuesta.json()) as { success?: boolean; error?: string };
      if (!respuesta.ok || !data.success) throw new Error(data.error || 'No se pudo guardar');
      setForm(VACIO);
      await cargar();
      setMensaje('Cuenta bancaria publicada. Ya aparece en el checkout.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActivo(cuenta: CuentaBancaria) {
    setLoading(true);
    setError(null);
    try {
      const respuesta = await fetch('/api/admin/cuentas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cuenta.id, activo: !cuenta.activo }),
      });
      const data = (await respuesta.json()) as { success?: boolean; error?: string };
      if (!respuesta.ok || !data.success) throw new Error(data.error || 'No se pudo actualizar');
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Cuentas bancarias</p>
        <h2 className="text-2xl font-extrabold text-slate-100">Datos para transferencia local</h2>
        <p className="mt-1 text-sm text-slate-400">
          BAC, Atlántida, Ficohsa u otro banco. El cliente las ve en el checkout.
        </p>
        {origen === 'storage' && (
          <p className="mt-2 text-xs text-amber-300">
            Ejecuta <code>supabase/mision_009_pagos.sql</code> en el SQL Editor para usar la tabla{' '}
            <code>cuentas_bancarias</code>. Mientras tanto se guarda en Storage.
          </p>
        )}
      </div>

      {mensaje && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          {mensaje}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>
      )}

      <form onSubmit={guardar} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-2">
        <label className="text-sm">
          <span className="text-slate-400">Banco</span>
          <input
            required
            value={form.banco}
            onChange={(event) => setForm((prev) => ({ ...prev, banco: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
            placeholder="BAC Credomatic"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-400">Número de cuenta</span>
          <input
            required
            value={form.numero_cuenta}
            onChange={(event) => setForm((prev) => ({ ...prev, numero_cuenta: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
            placeholder="7401-XXXX-X"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-400">Titular</span>
          <input
            required
            value={form.titular}
            onChange={(event) => setForm((prev) => ({ ...prev, titular: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
            placeholder="CreacionArte"
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-400">Tipo de cuenta</span>
          <input
            value={form.tipo_cuenta}
            onChange={(event) => setForm((prev) => ({ ...prev, tipo_cuenta: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
            placeholder="Ahorro / Cheques"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="text-slate-400">RTN (opcional)</span>
          <input
            value={form.rtn}
            onChange={(event) => setForm((prev) => ({ ...prev, rtn: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Agregar cuenta
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-300">Cuentas</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Banco</th>
                <th className="px-4 py-3 font-medium">Cuenta</th>
                <th className="px-4 py-3 font-medium">Titular</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No hay cuentas. Agrega la primera arriba.
                  </td>
                </tr>
              ) : (
                cuentas.map((cuenta) => (
                  <tr key={cuenta.id} className="border-t border-slate-800/80">
                    <td className="px-4 py-3 font-medium text-slate-100">
                      {cuenta.banco}
                      {cuenta.tipo_cuenta ? (
                        <span className="block text-xs text-slate-500">{cuenta.tipo_cuenta}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{cuenta.numero_cuenta}</td>
                    <td className="px-4 py-3 text-slate-300">{cuenta.titular}</td>
                    <td className="px-4 py-3">
                      <span className={cuenta.activo ? 'text-emerald-400' : 'text-slate-500'}>
                        {cuenta.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActivo(cuenta)}
                        disabled={loading}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-amber-500/50 hover:text-amber-400"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {cuenta.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
