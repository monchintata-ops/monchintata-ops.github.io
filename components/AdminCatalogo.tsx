'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Eraser, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import type { Producto } from '@/lib/types';
import { esArchivoR2KeyValida } from '@/lib/r2Key';

type Modo = 'crear' | 'editar' | null;

type Formulario = {
  titulo: string;
  categoria: string;
  precio: string;
  descripcion: string;
  imagen_preview_url: string;
  archivo_r2_key: string;
};

const VACIO: Formulario = {
  titulo: '',
  categoria: '',
  precio: '',
  descripcion: '',
  imagen_preview_url: '',
  archivo_r2_key: '',
};

function aFormulario(producto?: Producto | null): Formulario {
  if (!producto) return VACIO;
  return {
    titulo: producto.titulo || '',
    categoria: String(producto.categoria || ''),
    precio: Number(producto.precio).toFixed(2),
    descripcion: String(producto.descripcion || ''),
    imagen_preview_url: String(producto.imagen_preview_url || ''),
    archivo_r2_key: String(producto.archivo_r2_key || ''),
  };
}

export default function AdminCatalogo({
  productosIniciales,
  errorInicial,
}: {
  productosIniciales: Producto[];
  errorInicial?: string | null;
}) {
  const [productos, setProductos] = useState(productosIniciales);
  const [modo, setModo] = useState<Modo>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<Formulario>(VACIO);
  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState<'preview' | 'impresion' | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(errorInicial || null);
  const [error, setError] = useState<string | null>(null);

  const tituloPanel = useMemo(() => {
    if (modo === 'crear') return 'Agregar nuevo diseño';
    if (modo === 'editar') return 'Editar producto';
    return null;
  }, [modo]);

  function abrirCrear() {
    setModo('crear');
    setEditandoId(null);
    setForm(VACIO);
    setError(null);
    setMensaje(null);
  }

  function abrirEditar(producto: Producto) {
    setModo('editar');
    setEditandoId(producto.id);
    setForm(aFormulario(producto));
    setError(null);
    setMensaje(null);
  }

  function cancelar() {
    setModo(null);
    setEditandoId(null);
    setForm(VACIO);
    setError(null);
  }

  function campo<K extends keyof Formulario>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function recargarLista() {
    const respuesta = await fetch('/api/admin/productos');
    const data = (await respuesta.json()) as { success?: boolean; productos?: Producto[] };
    if (data.success && data.productos) {
      setProductos(data.productos);
    }
  }

  async function subirArchivo(file: File, tipo: 'preview' | 'impresion') {
    setSubiendo(tipo);
    setError(null);
    try {
      const cuerpo = new FormData();
      cuerpo.append('file', file);
      cuerpo.append('tipo', tipo);
      const respuesta = await fetch('/api/upload', { method: 'POST', body: cuerpo });
      const data = (await respuesta.json()) as {
        success?: boolean;
        archivo_r2_key?: string;
        imagen_preview_url?: string;
        error?: string;
      };
      if (!respuesta.ok || !data.success) {
        throw new Error(data.error || 'No se pudo subir el archivo');
      }
      if (tipo === 'impresion') {
        if (!esArchivoR2KeyValida(data.archivo_r2_key)) {
          throw new Error('La subida no devolvió un archivo_r2_key válido');
        }
        campo('archivo_r2_key', data.archivo_r2_key.trim());
      }
      if (tipo === 'preview' && data.imagen_preview_url) {
        campo('imagen_preview_url', data.imagen_preview_url);
      }
      setMensaje('Archivo subido a Storage. Recuerda guardar el producto.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setSubiendo(null);
    }
  }

  async function limpiarDuplicados() {
    const ok = window.confirm(
      'Se eliminarán productos con el mismo título y se conservará uno. ¿Continuar?'
    );
    if (!ok) return;

    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const respuesta = await fetch('/api/admin/productos/limpiar', { method: 'POST' });
      const data = (await respuesta.json()) as {
        success?: boolean;
        eliminados?: number;
        conservados?: number;
        error?: string;
      };
      if (!respuesta.ok || !data.success) {
        throw new Error(data.error || 'No se pudo limpiar');
      }
      await recargarLista();
      setMensaje(`Duplicados eliminados: ${data.eliminados}. Quedan ${data.conservados} productos.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al limpiar duplicados');
    } finally {
      setLoading(false);
    }
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    if (subiendo) {
      setError('Espera a que termine la subida a Storage.');
      return;
    }
    if (!esArchivoR2KeyValida(form.archivo_r2_key)) {
      setError('Sube el archivo de impresión (.png/.svg) y espera a que /api/upload asigne archivo_r2_key antes de guardar.');
      return;
    }

    setLoading(true);
    setError(null);
    setMensaje(null);

    const body = {
      titulo: form.titulo,
      categoria: form.categoria,
      precio: Number(form.precio),
      descripcion: form.descripcion,
      imagen_preview_url: form.imagen_preview_url,
      archivo_r2_key: form.archivo_r2_key.trim(),
    };

    try {
      const respuesta =
        modo === 'editar' && editandoId
          ? await fetch(`/api/admin/productos/${editandoId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
          : await fetch('/api/admin/productos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });

      const data = (await respuesta.json()) as {
        success?: boolean;
        producto?: Producto;
        error?: string;
      };

      if (!respuesta.ok || !data.success || !data.producto) {
        throw new Error(data.error || 'No se pudo guardar el producto');
      }

      setProductos((prev) => {
        const resto = prev.filter((item) => item.id !== data.producto!.id);
        return [...resto, data.producto!].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
      });
      setMensaje(modo === 'editar' ? 'Cambios guardados. Ya se ven en el catálogo.' : 'Diseño publicado en el catálogo.');
      cancelar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  async function borrar(producto: Producto) {
    const ok = window.confirm(`¿Borrar "${producto.titulo}" del catálogo? Esta acción no se puede deshacer.`);
    if (!ok) return;

    setLoading(true);
    setError(null);
    setMensaje(null);

    try {
      const respuesta = await fetch(`/api/admin/productos/${producto.id}`, { method: 'DELETE' });
      const data = (await respuesta.json()) as { success?: boolean; error?: string };
      if (!respuesta.ok || !data.success) {
        throw new Error(data.error || 'No se pudo borrar');
      }
      setProductos((prev) => prev.filter((item) => item.id !== producto.id));
      if (editandoId === producto.id) cancelar();
      setMensaje('Producto eliminado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al borrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Panel de administración</p>
          <h1 className="text-2xl font-extrabold text-slate-100">CreacionArte DTF</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={abrirCrear}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Agregar nuevo diseño
          </button>
          <button
            type="button"
            onClick={limpiarDuplicados}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-60"
          >
            <Eraser className="h-4 w-4" />
            Limpiar duplicados
          </button>
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

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-300">
          Catálogo actual
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Título / Producto</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No hay productos. Agrega el primero con el botón de arriba.
                  </td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.id} className="border-t border-slate-800/80">
                    <td className="max-w-[16rem] break-words px-4 py-3 font-medium text-slate-100">{producto.titulo}</td>
                    <td className="px-4 py-3 text-slate-400">{producto.categoria || '—'}</td>
                    <td className="px-4 py-3 text-slate-200">${Number(producto.precio).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEditar(producto)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-amber-500/50 hover:text-amber-400"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => borrar(producto)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modo && (
        <section className="overflow-hidden break-words rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">{tituloPanel}</h2>
            <button type="button" onClick={cancelar} className="text-slate-500 hover:text-slate-200" aria-label="Cerrar formulario">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={guardar} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block text-sm md:col-span-2">
              <span className="text-slate-400">Título</span>
              <input
                required
                value={form.titulo}
                onChange={(event) => campo('titulo', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Categoría</span>
              <input
                value={form.categoria}
                onChange={(event) => campo('categoria', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
                placeholder="Marcas & Logos"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Precio ($)</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={(event) => campo('precio', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="text-slate-400">Descripción</span>
              <textarea
                rows={3}
                value={form.descripcion}
                onChange={(event) => campo('descripcion', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-amber-500/40 focus:ring-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Vista previa (.webp)</span>
              <input
                type="file"
                accept=".webp,image/webp,.png,.jpg,.jpeg,.svg"
                disabled={loading || Boolean(subiendo)}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void subirArchivo(file, 'preview');
                }}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-1 file:text-xs file:font-bold file:text-slate-950"
              />
              <span className="mt-1 block truncate text-[11px] text-slate-500">
                {subiendo === 'preview' ? 'Subiendo vista previa…' : form.imagen_preview_url || 'Sin archivo'}
              </span>
            </label>
            <label className="block text-sm">
              <span className="text-slate-400">Archivo de impresión (.png / .svg)</span>
              <input
                type="file"
                accept=".png,.svg,.webp,image/png,image/svg+xml"
                disabled={loading || Boolean(subiendo)}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void subirArchivo(file, 'impresion');
                }}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-1 file:text-xs file:font-bold file:text-slate-950"
              />
              <span className="mt-1 block truncate text-[11px] text-slate-500">
                {subiendo === 'impresion'
                  ? 'Subiendo PNG a Storage…'
                  : form.archivo_r2_key || 'Se asignará archivo_r2_key al subir'}
              </span>
            </label>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button
                type="submit"
                disabled={loading || Boolean(subiendo) || !esArchivoR2KeyValida(form.archivo_r2_key)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-70"
              >
                {loading || subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {subiendo ? 'Subiendo archivo a Storage...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={cancelar}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
