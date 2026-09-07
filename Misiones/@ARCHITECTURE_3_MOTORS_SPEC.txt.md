Lee el archivo ARCHITECTURE_3_MOTORS_SPEC.md y aplica los cambios en el proyecto:

1. Asegúrate de que el Motor 2 (/api/preview/...) procese el archivo original bajando la resolución a 450px a proporción, incrustando la marca de agua y aplicando el fondo oscuro (#1E293B).
2. Garantiza que las tarjetas del Catálogo principal lean este preview correctamente y que, en caso de cualquier error de carga, hagan fallback al mockup sin romper la vista.
3. Asegúrate de que el Motor 3 sea consumido únicamente por el visor de prendas/mockups en la vista de detalles.
4. Ejecuta `.\node_modules\.bin\tsc.cmd --noEmit` para verificar la compilación.
5. Al finalizar, ejecuta automáticamente en la terminal:
   git add .
   git commit -m "refactor: estandarizacion de los 3 motores para previews y mockups"
   git push origin main