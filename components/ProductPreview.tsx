'use client';

import { useState } from 'react';
import { FALLBACK_PREVIEW, resolvePreviewUrl } from '@/lib/preview';

export default function ProductPreview({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const initial = resolvePreviewUrl(src);
  const [current, setCurrent] = useState(initial);

  return (
    <img
      src={current}
      alt={alt}
      className={['max-w-full', className].filter(Boolean).join(' ')}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (current !== FALLBACK_PREVIEW) {
          setCurrent(FALLBACK_PREVIEW);
        }
      }}
    />
  );
}
