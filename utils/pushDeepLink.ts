import { withViewOrigin } from '@/utils/viewTracking';

export const BUSINESS_HOME_PAGE_IDS = [
  'profile',
  'overview',
  'findyou',
  'locations',
  'customers',
  'membership',
  'campaign',
  'spotlight',
] as const;

export type BusinessHomePageParam = (typeof BUSINESS_HOME_PAGE_IDS)[number];

/** Validates a `page` route param; anything unknown (or an array) falls back to `profile`. */
export function parseBusinessHomePage(value: string | string[] | undefined): BusinessHomePageParam {
  const page = Array.isArray(value) ? value[0] : value;
  return (BUSINESS_HOME_PAGE_IDS as readonly string[]).includes(page ?? '')
    ? (page as BusinessHomePageParam)
    : 'profile';
}

/**
 * Route path for a push deep link, or null when it has none (list links are opened through
 * the list modal store instead). `/business-home?page=x` carries the target page along.
 */
export function resolveDeepLinkPath(rawLink: string | null | undefined): string | null {
  const link = rawLink?.trim();
  if (!link) return null;

  if (link.startsWith('/lists/')) return null;
  if (link.startsWith('/profile/')) {
    const userId = link.replace('/profile/', '').split('/')[0];
    if (userId) return withViewOrigin(`/profile/${userId}`, 'notification');
  }
  if (link.startsWith('/home/spotlight')) return '/(app)/(tabs)/home/spotlight';
  if (link.startsWith('/home/offers')) return '/(app)/(tabs)/home/offers';
  if (link.startsWith('/notifications')) return '/(app)/(stack)/notifications';
  if (link.startsWith('/business-home')) {
    const query = link.split('?')[1];
    const page = query
      ? new URLSearchParams(query).get('page')
      : null;
    const base = '/(app)/(stack)/business-home';
    return page ? `${base}?page=${parseBusinessHomePage(page)}` : base;
  }
  if (link.startsWith('/claim-business')) return '/(app)/(stack)/claim-business';
  return null;
}
