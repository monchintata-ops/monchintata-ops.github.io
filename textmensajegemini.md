### Orden de Comando para la IA en Visual Studio Code

Copia y pega este prompt en el chat de tu IA en VS Code:

```text
Lee el archivo MOCKUP_FINE_TUNING_SPEC.md y aplica los ajustes finales:

1. En `lib/mockup-config.ts`:
   - En la opción `termo`, reduce el ancho (`width`) y ajusta la posición horizontal (`x`) para que el logo no se encime sobre el asa metálica derecha.
   - En la opción `gorra`, reduce el tamaño del `printArea` en un 25% aproximadamente para que el logo no toque la visera ni los bordes superiores.
2. En `components/MockupViewer.tsx`:
   - Asegúrate de habilitar `ctx.imageSmoothingEnabled = true` y `ctx.imageSmoothingQuality = 'high'` antes de llamar a `ctx.drawImage`.
3. Ejecuta `.\node_modules\.bin\tsc.cmd --noEmit` para verificar compilación sin errores.
4. Haz git add, commit y push a origin main.