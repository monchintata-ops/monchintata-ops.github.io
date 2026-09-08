# Fase 2: Bitácora de Diseños y Gestión de Ciclo de Vida (Lifecycle Management)

## Objetivo
Implementar el seguimiento de actividad de los productos (fechas y conteo de ventas) y habilitar un panel de auditoría para que el Administrador identifique y gestione productos inactivos o sin ventas para optimizar el almacenamiento en Supabase.

---

## 1. Campos de Auditoría y Estado en Productos

- Asegurar compatibilidad en las consultas de `productos` con los siguientes campos:
  - `created_at`: Fecha de creación.
  - `total_ventas`: Contador de compras aprobadas (default 0).
  - `status`: Estado de publicación ('active' | 'archived' | 'pending_review').

---

## 2. Módulo de Auditoría en Admin (`/admin` - Pestaña Limpieza / Inactivos)

- Crear un componente o sección en el Admin para listar productos que cumplan las reglas de inactividad:
  - Productos con más de 60 días de publicados y 0 ventas.
  - Acciones directas para el Admin:
    - **Archivar:** Oculta el producto del catálogo público.
    - **Eliminar y Liberar Espacio:** Elimina el registro y borra físicamente los archivos del bucket `archivos-privados` y `mockups` en Supabase Storage.

---

## 3. Verificación y Despliegue Automático

1. Validar tipos: `.\node_modules\.bin\tsc.cmd --noEmit`.
2. Publicar cambios en producción:
   - `git add .`
   - `git commit -m "feat: fase 2 - bitacora de rendimiento y gestion de diseños inactivos"`
   - `git push origin main`