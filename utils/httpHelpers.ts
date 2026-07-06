import { getApiBaseUrl } from '../http/environment.config';

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;

  const root = getApiBaseUrl();
  if (!root) return url;

  const serverOrigin = new URL(root).origin;
  return `${serverOrigin}${url}`;
}
