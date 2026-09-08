Lee el archivo PHASE_1_ROLES_AND_QUOTAS_SPEC.md y ejecuta la implementación de la Fase 1:

1. Modifica las consultas y tipos para soportar el campo `creador_id` en los productos y el rol del usuario actual.
2. Agrega las validaciones de tamaño de archivo (máx 25MB para maestros, máx 3MB para mockups) en los inputs del panel de subida.
3. Asegúrate de que solo los usuarios autorizados puedan ejecutar la subida a los buckets de Supabase Storage.
4. Valida compilación con `.\node_modules\.bin\tsc.cmd --noEmit`.
5. Ejecuta automáticamente en la terminal:
   git add .
   git commit -m "feat: fase 1 - sistema de roles, estado de diseñadores y limites de subida"
   git push origin main