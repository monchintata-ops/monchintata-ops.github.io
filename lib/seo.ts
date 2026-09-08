import type { Producto } from '@/lib/types';

const CATEGORIAS = {
  dtf: ['DTF', 'Sublimacion', 'VectoresTextiles', 'CreacionArte'],
  uvdtf: ['UV-DTF', 'Transfer', 'ImpresionDigital', 'CreacionArte'],
  sublimacion: ['Sublimacion', 'Textiles', 'DTF', 'CreacionArte'],
  vector: ['Vectores', 'Diseño', 'DTF', 'CreacionArte'],
};

export function slugProducto(titulo: string) {
  const limpio = (titulo || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim();

  return limpio.replace(/\s+/g, '-').replace(/-+/g, '-');
}

export function hashtagsProducto(producto: Pick<Producto, 'categoria' | 'titulo'>) {
  const tags = new Set<string>();
  const categoria = (producto.categoria || '').toLowerCase();
  const base = slugProducto(producto.titulo || '');

  if (categoria.includes('dtf')) {
    CATEGORIAS.dtf.forEach((tag) => tags.add(`#${tag}`));
  } else if (categoria.includes('uv')) {
    CATEGORIAS.uvdtf.forEach((tag) => tags.add(`#${tag}`));
  } else if (categoria.includes('sub')) {
    CATEGORIAS.sublimacion.forEach((tag) => tags.add(`#${tag}`));
  } else {
    CATEGORIAS.vector.forEach((tag) => tags.add(`#${tag}`));
  }

  if (base) {
    tags.add(`#${base.replace(/-/g, '')}`);
  }

  return Array.from(tags).slice(0, 6);
}

export function descripcionSeoProducto(producto: Pick<Producto, 'titulo' | 'descripcion'>) {
  const titulo = producto.titulo?.trim();
  const descripcionBase = producto.descripcion?.trim();

  if (descripcionBase) {
    return `Descarga ${titulo || 'este diseño'} en formato vectorial y PNG de alta resolución. ${descripcionBase}`;
  }

  return `Descarga ${titulo || 'este diseño'} en formato vectorial y PNG de alta resolución. Optimizado para DTF, UV-DTF y sublimación.`;
}

export function jsonLdProducto(producto: Producto, canonicalUrl?: string) {
  const image = producto.imagen_preview_url ? producto.imagen_preview_url : '/placeholder_preview.svg';
  const imageUrl = image.startsWith('http') ? image : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${image.startsWith('/') ? image : `/${image}`}`;
  const precio = Number(producto.precio ?? 0);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.titulo,
    image: imageUrl,
    description: descripcionSeoProducto(producto),
    sku: producto.id,
    url: canonicalUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/producto/${producto.id}`,
    brand: {
      '@type': 'Brand',
      name: 'CreacionArte',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: Number.isFinite(precio) ? precio : 0,
      availability: 'https://schema.org/InStock',
      url: canonicalUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/producto/${producto.id}`,
    },
  };
}
