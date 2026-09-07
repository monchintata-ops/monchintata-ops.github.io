export const FALLBACK_PREVIEW = '/placeholder_preview.svg';

export function resolvePreviewUrl(url?: string | null) {
  const value = url?.trim();
  if (!value || value.endsWith('placeholder_preview.webp')) {
    return FALLBACK_PREVIEW;
  }
  if (value.startsWith('/api/preview?')) {
    return value;
  }
  if (value.startsWith('previews/') || value.startsWith('mockups/')) {
    return `/api/preview?key=${encodeURIComponent(value)}`;
  }
  return value;
}
