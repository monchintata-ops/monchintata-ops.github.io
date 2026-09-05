# Correccion de Generacion y Recuperacion de Preview

## Objetivo

La API de preview debe responder siempre con una imagen WebP valida para que un fallo de Storage o Sharp no active el fallback del navegador en el catalogo.

## Comportamiento

- Sharp procesa las previews a un maximo proporcional de 450px.
- Las previews conservan el fondo `#1E293B` y la marca de agua diagonal.
- Los fallos de procesamiento se registran con la clave de Storage y devuelven un WebP de estado, nunca JSON con `Content-Type` de imagen.
- Los fallos de lectura de Storage siguen devolviendo un WebP de estado para evitar que el componente de imagen rompa su carga.