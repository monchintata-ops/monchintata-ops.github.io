# Refactorización de Subida y Generación de Assets (3 Motores)

## Objetivo
Estructurar el flujo de subida del administrador y la generación de imágenes bajo 3 responsabilidades estrictas: Archivo Maestro Privado, Vista Previa Protegida y Asset Limpio para Mockups.

---

## 1. Comportamiento de los 3 Motores en el Backend

1. **Motor 1 (Archivo Original):**
   - Guardar en bucket privado `archivos-privados`.
   - Prohibir acceso público directo.

2. **Motor 2 (Generador de Preview / Marca de Agua):**
   - Endpoint: `/api/preview/[key]`.
   - Procesar mediante Sharp: tomar el archivo de Motor 1 + Marca de agua opcional.
   - Forzar salida WebP: máx `450px` a proporción, fondo `#1E293B` y marca de agua superpuesta al 50% de opacidad.
   - Devolver cabecera `Cache-Control: no-store, must-revalidate`.

3. **Motor 3 (Asset para Mockups):**
   - Guardar en bucket público `mockups`.
   - Utilizar exclusivamente en el visor de canvas/prendas (`/producto/[id]`).

---

## 2. Ajustes en el Panel Admin (`/admin`)

- Etiquetar claramente en la UI los 3 inputs del formulario:
  - Input 1: **Archivo Original de Impresión** (Procesa descarga post-pago y genera la preview).
  - Input 2: **Marca de Agua Personalizada** (Opcional - sobrescribe la marca por defecto).
  - Input 3: **Imagen Transparente para Mockups** (Exclusiva para el simulador de prendas/termos).

---

## 3. Verificación y Despliegue Automático

1. Validar compilación de tipos: `.\node_modules\.bin\tsc.cmd --noEmit`.
2. Publicar en producción:
   - `git add .`
   - `git commit -m "refactor: estandarizacion de los 3 motores para previews y mockups"`
   - `git push origin main`