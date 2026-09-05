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
    let activo = true;
    const controller = new AbortController();
    setCurrent(initial);

    const url = new URL(initial, window.location.href);
    if (url.origin !== window.location.origin || initial === FALLBACK_PREVIEW) {
      return () => controller.abort();
    }

    fetch(url, { cache: 'no-store', signal: controller.signal })
      .then((response) => {
        if (!activo || response.ok) return;
        setCurrent(fallback !== FALLBACK_PREVIEW ? fallback : FALLBACK_PREVIEW);
      })
      .catch(() => {
        if (activo) {
          setCurrent(fallback !== FALLBACK_PREVIEW ? fallback : FALLBACK_PREVIEW);
        }
      });

    return () => {
      activo = false;
      controller.abort();
    };
  }, [fallback, initial]);

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
