'use client';

import { useEffect, useState } from 'react';
import { FALLBACK_PREVIEW, resolvePreviewUrl } from '@/lib/preview';

export default function ProductPreview({
  src,
  fallbackSrc,
  alt,
  className,
}: {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  className?: string;
}) {
  const fallback = resolvePreviewUrl(fallbackSrc);
  const preview = resolvePreviewUrl(src);
  const initial = preview === FALLBACK_PREVIEW && fallback !== FALLBACK_PREVIEW ? fallback : preview;
  const [current, setCurrent] = useState(initial);

  useEffect(() => {
    setCurrent(initial);
  }, [initial]);

  return (
    <img
      src={current}
      alt={alt}
      className={['max-w-full', className].filter(Boolean).join(' ')}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (current !== fallback && fallback !== FALLBACK_PREVIEW) {
          setCurrent(fallback);
        } else if (current !== FALLBACK_PREVIEW) {
          setCurrent(FALLBACK_PREVIEW);
        }
      }}
    />
  );
}
