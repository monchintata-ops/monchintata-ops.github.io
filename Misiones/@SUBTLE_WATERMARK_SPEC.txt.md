Lee el archivo SUBTLE_WATERMARK_SPEC.md y aplica los cambios:

1. Modifica la API `/api/preview` para que la marca de agua sea sutil y no opaque el diseño.
2. Reduce la escala del PNG de la marca de agua a 150px de ancho y aplícale una opacidad baja (25%-30% máx).
3. Asegúrate de que el patrón repetido utilice un modo de composición limpio ('overlay' o 'soft-light' en Sharp) para integrarse suavemente sobre el arte de fondo (#1E293B).
4. Verifica que compile correctamente con `.\node_modules\.bin\tsc.cmd --noEmit`.
5. Ejecuta automáticamente en la terminal:
   git add .
   git commit -m "style: ajuste sutil de opacidad y escala para marca de agua en previews"
   git push origin main