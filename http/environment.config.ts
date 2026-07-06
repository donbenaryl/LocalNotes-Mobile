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
