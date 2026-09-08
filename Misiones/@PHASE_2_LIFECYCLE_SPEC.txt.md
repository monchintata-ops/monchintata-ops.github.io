Lee el archivo PHASE_2_LIFECYCLE_SPEC.md y ejecuta la implementación de la Fase 2:

1. Agrega el soporte de campos de auditoría (`total_ventas`, `status`) en el cliente de productos y llamadas a base de datos con manejo seguro de fallbacks si las columnas aún no están migradas en Supabase.
2. Añade en el panel administrativo (`/admin`) la vista o pestaña de auditoría de almacenamiento que filtre productos inactivos (sin ventas) y permita al administrador archivarlos o eliminarlos junto con sus archivos de Supabase Storage.
3. Valida compilación ejecutando `.\node_modules\.bin\tsc.cmd --noEmit`.
4. Ejecuta automáticamente en la terminal:
   git add .
   git commit -m "feat: fase 2 - bitacora de rendimiento y gestion de diseños inactivos"
   git push origin main