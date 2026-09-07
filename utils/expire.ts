import type { ExpireAfter } from '@/constants/expire';

const EXPIRE_AFTER_TO_MS: Record<Exclude<ExpireAfter, 'never'>, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

/** Maps UI expire presets to an ISO timestamp, or null for never. */
export function getExpiresAt(value: ExpireAfter): string | null {
  if (value === 'never') return null;
  return new Date(Date.now() + EXPIRE_AFTER_TO_MS[value]).toISOString();
}
