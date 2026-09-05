'use client';

import { useEffect, useRef, useState } from 'react';
import { MOCKUP_TEMPLATES } from '@/lib/mockup-config';

interface MockupViewerProps {
  designUrl: string;
  defaultProduct?: string;
}

export default function MockupViewer({ designUrl, defaultProduct = 'camisa' }: MockupViewerProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>(defaultProduct);
  const [loading, setLoading] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement null |>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setLoading(true);
    const template = MOCKUP_TEMPLATES[selectedProduct] || MOCKUP_TEMPLATES.camisa;

    const baseImg = new Image();
    const designImg = new Image();

    baseImg.crossOrigin = 'anonymous';
    designImg.crossOrigin = 'anonymous';

    baseImg.src = template.baseImage;
    designImg.src = designUrl;

    Promise.all([
      new Promise((resolve) => { baseImg.onload = resolve; }),
      new Promise((resolve) => { designImg.onload = resolve; })
    ]).then(() => {
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;

      // 1. Dibujar imagen de la prenda
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseImg, 0, 0);

      // 2. Superponer el diseño en la zona de estampado
      const { x, y, width, height } = template.printArea;
      ctx.drawImage(designImg, x, y, width, height);

      setLoading(false);
    });
  }, [selectedProduct, designUrl]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Botones de selección directa (1 clic) */}
      <div className="flex flex-wrap justify-center gap-2">
        {Object.values(MOCKUP_TEMPLATES).map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setSelectedProduct(template.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              selectedProduct === template.id
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {template.label}
          </button>
        ))}
      </div>

      {/* Canvas Render */}
      <div className="relative w-full max-w-sm aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 text-amber-500 text-xs font-medium">
            Cargando Previsualización...
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
      </div>
    </div>
  );
}