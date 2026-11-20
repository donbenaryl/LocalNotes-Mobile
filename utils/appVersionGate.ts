import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { appVersionService } from '@/http/app-api/app-version.service';
import type { MobileVersionConfigDAO } from '@/http/app-api/types';
import { isVersionBelow } from '@/utils/semver';

export const DEFAULT_IOS_STORE_URL =
  'https://apps.apple.com/us/app/localnotes-find-what-fits/id6787916371';
export const DEFAULT_ANDROID_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.localnotes.mobile';

export type ForceUpdateRequirement = {
  required: true;
  storeUrl: string;
};

export type ForceUpdateCheckResult =
  | { required: false }
  | ForceUpdateRequirement;

/** Last store URL from a successful force-update check (module cache for the screen). */
let cachedStoreUrl: string | null = null;
/** True while the blocking force-update route is mounted. */
let forceUpdateScreenActive = false;

export function getCachedForceUpdateStoreUrl(): string {
  if (cachedStoreUrl) return cachedStoreUrl;
  return Platform.OS === 'android'
    ? DEFAULT_ANDROID_STORE_URL
    : DEFAULT_IOS_STORE_URL;
}

export function setCachedForceUpdateStoreUrl(url: string): void {
  cachedStoreUrl = url.trim() || null;
}

export function setForceUpdateScreenActive(active: boolean): void {
  forceUpdateScreenActive = active;
}

export function isForceUpdateScreenActive(): boolean {
  return forceUpdateScreenActive;
}

/** Installed marketing version from Expo config / native binary. */
export function getInstalledAppVersion(): string {
  return (
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    '1.0.0'
  );
}

function storeUrlForPlatform(config: MobileVersionConfigDAO): string {
  if (Platform.OS === 'ios') {
    return config.ios_store_url?.trim() || DEFAULT_IOS_STORE_URL;
  }
  if (Platform.OS === 'android') {
    return config.android_store_url?.trim() || DEFAULT_ANDROID_STORE_URL;
  }
  return DEFAULT_IOS_STORE_URL;
}

function minVersionForPlatform(config: MobileVersionConfigDAO): string | null {
  if (Platform.OS === 'ios') return config.ios_min_version;
  if (Platform.OS === 'android') return config.android_min_version;
  return null;
}

/**
 * Fetch server min versions and decide whether a hard update is required.
 * Fail-open: network/parse issues return `{ required: false }`.
 */
export async function checkForceUpdateRequired(): Promise<ForceUpdateCheckResult> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return { required: false };
  }

  try {
    const response = await appVersionService.getVersionConfig();
    const config = response.data?.data;
    if (!config) return { required: false };

    const minVersion = minVersionForPlatform(config);
    if (!minVersion?.trim()) return { required: false };

    const current = getInstalledAppVersion();
    if (!isVersionBelow(current, minVersion)) {
      return { required: false };
    }

    const storeUrl = storeUrlForPlatform(config);
    setCachedForceUpdateStoreUrl(storeUrl);
    return { required: true, storeUrl };
  } catch {
    return { required: false };
  }
}
