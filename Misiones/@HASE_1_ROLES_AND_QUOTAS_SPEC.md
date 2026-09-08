# Fase 1: Control de Acceso, Roles y Cuotas de Almacenamiento

## Objetivo
Configurar el sistema de usuarios con roles (`admin`, `designer`, `customer`), restricción de registro para colaboradores y control estricto de cuota de archivos en la subida.

---

## 1. Estructura de Base de Datos (Supabase SQL)

- Crear/actualizar tabla `perfiles`:
  - `id`: uuid (PK, references auth.users)
  - `rol`: text ('admin' | 'designer' | 'customer') default 'customer'
  - `estado`: text ('pending' | 'active' | 'suspended') default 'pending'
  - `max_storage_mb`: integer default 500
- Agregar `creador_id` (uuid) a la tabla `productos`.

---

## 2. Validaciones en el Formulario de Subida (`/admin` / API)

- Verificar que el usuario tenga `rol === 'admin'` o `rol === 'designer'` con `estado === 'active'`.
- Validar límites de archivos antes del subido a Supabase Storage:
  - Archivo Maestro (.png/.svg): Máximo 25 MB.
  - Mockup (.png/.jpg): Máximo 3 MB.

---

## 3. Verificación y Despliegue Automático

1. Validar tipos en TypeScript: `.\node_modules\.bin\tsc.cmd --noEmit`.
2. Publicar cambios:
   - `git add .`
   - `git commit -m "feat: fase 1 - sistema de roles, estado de diseñadores y limites de subida"`
   - `git push origin main`