'use client';

import { useEffect, useRef, useState } from 'react';
import { MOCKUP_TEMPLATES } from '@/lib/mockup-config';
import type { Producto } from '@/lib/types';

interface MockupViewerProps {
  product: Pick<Producto, 'imagen_preview_url' | 'diseno_mockup_url' | 'diseno_corte_url' | 'logo_url'>;
  defaultProduct?: string;
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.crossOrigin = 'anonymous';
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    imagen.src = src;
  });
}

export default function MockupViewer({ product, defaultProduct = 'camisa-negra' }: MockupViewerProps) {
  const initialProduct = MOCKUP_TEMPLATES[defaultProduct] ? defaultProduct : 'camisa-negra';
  const [selectedProduct, setSelectedProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      setError('El navegador no admite Canvas HTML5.');
      setLoading(false);
      return undefined;
    }

    const template = MOCKUP_TEMPLATES[selectedProduct] ?? MOCKUP_TEMPLATES['camisa-negra'];
    const designUrl = product.diseno_mockup_url || product.diseno_corte_url || product.logo_url || product.imagen_preview_url;
    setLoading(true);
    setError(null);

    Promise.all([cargarImagen(template.baseImage), cargarImagen(designUrl)])
      .then(([baseImage, designImage]) => {
        if (cancelled) return;

        canvas.width = baseImage.naturalWidth || baseImage.width;
        canvas.height = baseImage.naturalHeight || baseImage.height;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

        const { x, y, width, height } = template.printArea;
        const scale = Math.min(width / designImage.width, height / designImage.height);
        const designWidth = designImage.width * scale;
        const designHeight = designImage.height * scale;
        context.drawImage(
          designImage,
          x + (width - designWidth) / 2,
          y + (height - designHeight) / 2,
          designWidth,
          designHeight,
        );
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : 'No se pudo generar el mockup.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [product, selectedProduct]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="relative z-10 flex flex-wrap justify-start gap-1.5" role="group" aria-label="Tipo de producto">
        {Object.values(MOCKUP_TEMPLATES).map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setSelectedProduct(template.id);
            }}
            aria-pressed={selectedProduct === template.id}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              selectedProduct === template.id
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {template.label}
          </button>
        ))}
      </div>

      <div className="relative flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        <canvas ref={canvasRef} className="h-full w-full object-contain" aria-label="Vista previa del mockup" />
        {(loading || error) && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-4 text-center text-xs font-medium text-amber-400">
            {error ?? 'Cargando previsualización...'}
          </div>
        )}
      </div>
    </div>
  );
}