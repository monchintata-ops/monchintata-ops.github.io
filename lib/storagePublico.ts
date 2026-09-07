import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';

export const STORAGE_BUCKET_MOCKUPS = 'mockups';

let bucketListo: Promise<void> | null = null;

export function storagePublicoConfigurado() {
  return isSupabaseAdminConfigured();
}

async function asegurarBucketPublico() {
  if (!bucketListo) {
    bucketListo = (async () => {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase.storage.getBucket(STORAGE_BUCKET_MOCKUPS);

      if (!data) {
        const { error } = await supabase.storage.createBucket(STORAGE_BUCKET_MOCKUPS, {
          public: true,
          fileSizeLimit: '25MB',
        });
        if (error && !/already exists|duplicate|exists/i.test(error.message)) {
          throw new Error(`No se pudo crear el bucket ${STORAGE_BUCKET_MOCKUPS}: ${error.message}`);
        }
        return;
      }

      if (!data.public) {
        const { error } = await supabase.storage.updateBucket(STORAGE_BUCKET_MOCKUPS, { public: true });
        if (error) {
          throw new Error(`No se pudo hacer público el bucket ${STORAGE_BUCKET_MOCKUPS}: ${error.message}`);
        }
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

export async function subirArchivoPublico(params: {
  path: string;
  body: File | Blob | Buffer | ArrayBuffer | Uint8Array;
  contentType: string;
  upsert?: boolean;
}) {
  await asegurarBucketPublico();
  const { error } = await getSupabaseAdmin().storage.from(STORAGE_BUCKET_MOCKUPS).upload(params.path, params.body, {
    contentType: params.contentType,
    upsert: Boolean(params.upsert),
  });

  if (error) {
    throw new Error(error.message || 'No se pudo subir el asset público de mockup');
  }

  return getSupabaseAdmin().storage.from(STORAGE_BUCKET_MOCKUPS).getPublicUrl(params.path).data.publicUrl;
}