/** URL pública del sitio: dominio custom, Vercel o localhost. */
export function urlPublicaSitio() {
  const explicita = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicita) {
    return explicita.replace(/\/$/, '');
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '');
    return `https://${host}`;
  }

  return 'http://localhost:3000';
}

export function urlAbsoluta(ruta = '/') {
  const path = ruta.startsWith('/') ? ruta : `/${ruta}`;
  return `${urlPublicaSitio()}${path}`;
}

export function urlComprobantePublico(ordenId: string) {
  return urlAbsoluta(`/api/comprobante/${ordenId}`);
}
