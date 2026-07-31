import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  getGoogleIosClientId,
  getGoogleWebClientId,
} from '../constants/googleAuth';

let googleConfigured = false;

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

export async function getGoogleIdToken(): Promise<string> {
  configureGoogleSignIn();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();
  if (response.type === 'cancelled') {
    throw new Error('Google sign-in was cancelled');
  }

  const idToken = response.data?.idToken;
  if (!idToken) {
    // Some platforms require a second call after interactive sign-in
    const tokens = await GoogleSignin.getTokens();
    if (!tokens.idToken) {
      throw new Error('Google did not return an ID token');
    }
    return tokens.idToken;
  }

  return idToken;
}

export async function getAppleIdToken(): Promise<string> {
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

  return credential.identityToken;
}
