import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';

export const STORAGE_BUCKET_PRIVADO = 'archivos-privados';
export const STORAGE_SIGNED_URL_TTL_SECONDS = 900;

let bucketListo: Promise<void> | null = null;

export function storagePrivadoConfigurado() {
  return isSupabaseAdminConfigured();
}

async function asegurarBucketPrivado() {
  if (!bucketListo) {
    bucketListo = (async () => {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase.storage.getBucket(STORAGE_BUCKET_PRIVADO);
      if (data) return;

      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET_PRIVADO, {
        public: false,
        fileSizeLimit: '25MB',
      });

      if (error && !/already exists|duplicate|exists/i.test(error.message)) {
        throw new Error(`No se pudo crear el bucket ${STORAGE_BUCKET_PRIVADO}: ${error.message}`);
      }
    })();
  }

  try {
    await bucketListo;
  } catch (error) {
    bucketListo = null;
    throw error;
  }
}

export async function subirArchivoPrivado(params: {
  path: string;
  body: File | Blob | Buffer | ArrayBuffer | Uint8Array;
  contentType: string;
  upsert?: boolean;
}) {
  await asegurarBucketPrivado();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(STORAGE_BUCKET_PRIVADO).upload(params.path, params.body, {
    contentType: params.contentType,
    upsert: Boolean(params.upsert),
  });

  if (error) {
    throw new Error(error.message || 'No se pudo subir el archivo a Storage');
  }

  return params.path;
}

export async function createSignedDownloadUrl(
  path: string,
  expiresIn = STORAGE_SIGNED_URL_TTL_SECONDS
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET_PRIVADO)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'No se pudo firmar la URL de descarga');
  }

  return data.signedUrl;
}

export async function descargarArchivoPrivado(path: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET_PRIVADO).download(path);

  if (error || !data) {
    throw new Error(error?.message || 'Archivo no encontrado en Storage');
  }

  return {
    bytes: new Uint8Array(await data.arrayBuffer()),
    contentType: data.type || 'application/octet-stream',
  };
}
