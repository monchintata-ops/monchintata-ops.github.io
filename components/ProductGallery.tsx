'use client';

import { useState } from 'react';
import MockupViewer from '@/components/MockupViewer';
import ProductPreview from '@/components/ProductPreview';
import { MOCKUP_TEMPLATES } from '@/lib/mockup-config';

type GallerySelection = 'preview' | 'camisa-negra' | 'camisa-blanca';

interface ProductGalleryProps {
  designUrl: string;
  title: string;
}

const options: Array<{ id: GallerySelection; label: string; thumbnail?: string }> = [
  { id: 'preview', label: 'Diseño limpio' },
  { id: 'camisa-negra', label: 'Camisa Negra', thumbnail: MOCKUP_TEMPLATES['camisa-negra'].baseImage },
  { id: 'camisa-blanca', label: 'Camisa Blanca', thumbnail: MOCKUP_TEMPLATES['camisa-blanca'].baseImage },
];

export default function ProductGallery({ designUrl, title }: ProductGalleryProps) {
  const [selection, setSelection] = useState<GallerySelection>('preview');

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4 sm:min-h-[440px]">
        {selection === 'preview' ? (
          <ProductPreview src={designUrl} alt={title} className="max-h-[560px] w-full object-contain" />
        ) : (
          <MockupViewer designUrl={designUrl} defaultProduct={selection} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Galería del producto">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelection(option.id)}
            aria-pressed={selection === option.id}
            className={`overflow-hidden rounded-lg border p-1 text-left transition ${
              selection === option.id
                ? 'border-amber-500 ring-1 ring-amber-500/60'
                : 'border-slate-800 hover:border-amber-500/60'
            }`}
          >
            <span className="flex aspect-square items-center justify-center overflow-hidden rounded bg-slate-900 px-1 text-center text-[10px] font-medium text-slate-300 sm:text-xs">
              {option.id === 'preview' ? (
                <ProductPreview src={designUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <img src={option.thumbnail} alt="" className="h-full w-full object-contain" />
              )}
            </span>
            <span className="mt-1 block truncate px-1 text-[10px] text-slate-400 sm:text-xs">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}