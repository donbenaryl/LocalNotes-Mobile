import Constants from 'expo-constants';

/** Backend API root (includes `/api`). Accepts apiUrl with or without a trailing `/api`. */
export function getApiBaseUrl(): string {
  const raw = String(Constants.expoConfig?.extra?.apiUrl ?? '')
    .trim()
    .replace(/\/$/, '');
  if (!raw) return '';
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

export const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

/** Web app root (no trailing slash) used to hand off paid features to the browser. */
export function getWebAppUrl(): string {
  return String(Constants.expoConfig?.extra?.webAppUrl ?? '').trim().replace(/\/$/, '');
}
