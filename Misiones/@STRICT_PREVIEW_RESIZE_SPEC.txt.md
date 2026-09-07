### Prompt Directo para la IA en Visual Studio Code

Copia y pega este prompt en el chat de tu IA en VS Code:

```text
Lee el archivo STRICT_PREVIEW_RESIZE_SPEC.md y corrige este fallo de seguridad urgente:

1. Modifica la API `/api/preview` para que descargue el archivo de Supabase y LO PROCESE OBLIGATORIAMENTE con Sharp antes de responder.
2. La imagen resultante DEBE ser un buffer WebP con ancho máximo de 450px (su Intrinsic size no puede ser 3260x4434), con fondo sólido #1E293B y marca de agua superpuesta.
3. Elimina cualquier redirección directa hacia la URL original del bucket.
4. Verifica que compile con `.\node_modules\.bin\tsc.cmd --noEmit`.
5. Ejecuta automáticamente en la terminal:
   git add .
   git commit -m "security: forzar redimensionamiento sharp a 450px webp en api preview"
   git push origin main