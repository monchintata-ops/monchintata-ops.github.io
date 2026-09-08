'use client';

import { useEffect, useState } from 'react';
import { Archive, Loader2, Trash2 } from 'lucide-react';
import type { Producto } from '@/lib/types';

export default function AdminAuditoria() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const respuesta = await fetch('/api/admin/productos/inactivos');
      const data = (await respuesta.json()) as {
        success?: boolean;
        productos?: Producto[];
        error?: string;
      };

      if (!respuesta.ok || !data.success) {
        throw new Error(data.error || 'No se pudo cargar la auditoría');
      }

      setProductos(data.productos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la auditoría');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function archivar(id: string) {
    setMensaje(null);
    setError(null);
    try {
      const respuesta = await fetch(`/api/admin/productos/${id}/archivar`, { method: 'POST' });
      const data = (await respuesta.json()) as { success?: boolean; error?: string };
      if (!respuesta.ok || !data.success) {
        throw new Error(data.error || 'No se pudo archivar');
      }
      await cargar();
      setMensaje('Producto archivado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo archivar');
    }
  }

  async function eliminar(id: string, titulo: string) {
    const confirmar = window.confirm(`¿Deseas eliminar "${titulo}" y liberar su espacio de almacenamiento?`);
    if (!confirmar) return;

    setMensaje(null);
    setError(null);
    try {
      const respuesta = await fetch(`/api/admin/productos/${id}`, { method: 'DELETE' });
      const data = (await respuesta.json()) as { success?: boolean; error?: string };
      if (!respuesta.ok || !data.success) {
        throw new Error(data.error || 'No se pudo eliminar');
      }
      await cargar();
      setMensaje('Producto y archivos eliminados.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Auditoría</p>
          <h2 className="text-2xl font-extrabold text-slate-100">Productos inactivos</h2>
        </div>
      </div>

      {mensaje && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          {mensaje}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Revisando archivos inactivos...
        </div>
      ) : productos.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-6 text-sm text-slate-400">
          No hay productos inactivos según la regla actual (más de 60 días sin ventas).
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Creado</th>
                  <th className="px-4 py-3 font-medium">Ventas</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.id} className="border-t border-slate-800/80">
                    <td className="px-4 py-3 font-medium text-slate-100">{producto.titulo}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {producto.created_at ?? producto.creado_en ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-200">{Number(producto.total_ventas ?? 0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => archivar(producto.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-amber-500/50 hover:text-amber-400"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          Archivar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminar(producto.id, producto.titulo)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
