import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  getGoogleIosClientId,
  getGoogleWebClientId,
} from '../constants/googleAuth';

let googleConfigured = false;

export type SocialSignInResult = {
  idToken: string;
  /** Best-effort name from the provider for username prefills. */
  displayName?: string;
};

function configureGoogleSignIn(): void {
  if (googleConfigured) return;

  const webClientId = getGoogleWebClientId();
  if (!webClientId) {
    throw new Error(
      'Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.',
    );
  }

  GoogleSignin.configure({
    webClientId,
    iosClientId: getGoogleIosClientId() || undefined,
    offlineAccess: false,
  });
  googleConfigured = true;
}

export async function getGoogleSignIn(): Promise<SocialSignInResult> {
  configureGoogleSignIn();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();
  if (response.type === 'cancelled') {
    throw new Error('Google sign-in was cancelled');
  }

  let idToken = response.data?.idToken ?? null;
  if (!idToken) {
    const tokens = await GoogleSignin.getTokens();
    if (!tokens.idToken) {
      throw new Error('Google did not return an ID token');
    }
    idToken = tokens.idToken;
  }

  const displayName =
    response.data?.user?.name?.trim() ||
    [response.data?.user?.givenName, response.data?.user?.familyName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    undefined;

  return { idToken, displayName: displayName || undefined };
}

/** @deprecated Prefer getGoogleSignIn for name prefills. */
export async function getGoogleIdToken(): Promise<string> {
  const result = await getGoogleSignIn();
  return result.idToken;
}

export async function getAppleSignIn(): Promise<SocialSignInResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple sign-in is only available on iOS');
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error('Apple sign-in is not available on this device');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token');
  }

  const displayName = [
    credential.fullName?.givenName,
    credential.fullName?.familyName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    idToken: credential.identityToken,
    displayName: displayName || undefined,
  };
}

/** @deprecated Prefer getAppleSignIn for name prefills. */
export async function getAppleIdToken(): Promise<string> {
  const result = await getAppleSignIn();
  return result.idToken;
}
