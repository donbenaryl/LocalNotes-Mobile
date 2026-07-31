import Constants from 'expo-constants';

interface GoogleAuthExtra {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleIosUrlScheme?: string;
}

function extra(): GoogleAuthExtra {
  return (Constants.expoConfig?.extra ?? {}) as GoogleAuthExtra;
}

/** Web client ID used as `webClientId` so the SDK returns an ID token. */
export function getGoogleWebClientId(): string {
  return (
    extra().googleWebClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    ''
  ).trim();
}

export function getGoogleIosClientId(): string {
  return (
    extra().googleIosClientId ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    ''
  ).trim();
}

export function getGoogleIosUrlScheme(): string {
  const explicit = (
    extra().googleIosUrlScheme ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ||
    ''
  ).trim();
  if (explicit) return explicit;

  const iosClientId = getGoogleIosClientId();
  const match = iosClientId.match(/^([\w-]+)\.apps\.googleusercontent\.com$/);
  if (!match) return '';
  return `com.googleusercontent.apps.${match[1]}`;
}
