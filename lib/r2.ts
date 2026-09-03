/** Cloudflare R2 ya no se usa. Los PNG privados viven en Supabase Storage. */
export {
  STORAGE_SIGNED_URL_TTL_SECONDS as R2_SIGNED_URL_TTL_SECONDS,
  storagePrivadoConfigurado as r2Configurado,
  createSignedDownloadUrl as getSignedDownloadUrl,
  subirArchivoPrivado as subirArchivoR2,
} from '@/lib/storagePrivado';
