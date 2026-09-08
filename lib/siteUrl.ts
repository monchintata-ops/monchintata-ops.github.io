/** URL pública del sitio: dominio custom, Vercel o localhost. */
import { metadataBase } from '@/lib/seo';

export function urlPublicaSitio() {
  return metadataBase.origin;
}

export function urlAbsoluta(ruta = '/') {
  const path = ruta.startsWith('/') ? ruta : `/${ruta}`;
  return `${urlPublicaSitio()}${path}`;
}

export function urlComprobantePublico(ordenId: string) {
  return urlAbsoluta(`/api/comprobante/${ordenId}`);
}
