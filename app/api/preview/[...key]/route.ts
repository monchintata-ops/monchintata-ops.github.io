import { GET as getPreview } from '@/app/api/preview/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request, { params }: { params: { key: string[] } }) {
  const key = params.key.join('/');
  const url = new URL(request.url);
  url.pathname = '/api/preview';
  url.searchParams.set('key', key);
  return getPreview(new Request(url, request));
}