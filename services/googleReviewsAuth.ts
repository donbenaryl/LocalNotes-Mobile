import * as AuthSession from "expo-auth-session";
import { Platform } from "react-native";
import {
  getGoogleIosClientId,
  getGoogleIosUrlScheme,
} from "@/constants/googleAuth";

const MAPS_REVIEWS_SCOPE =
  "https://www.googleapis.com/auth/dataportability.maps.reviews";

function getReviewsOAuthClientId(): string {
  if (Platform.OS !== "ios") {
    throw new Error(
      "Google reviews connect currently supports iOS only.",
    );
  }
  return getGoogleIosClientId();
}

export function getReviewsOAuthRedirectUri(): string {
  const scheme = getGoogleIosUrlScheme();
  if (!scheme) {
    throw new Error(
      "Google OAuth is not configured. Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.",
    );
  }
  // Google iOS clients require the reversed client ID and a single slash
  // (not localnotes://oauth, which Web clients and Google's policy reject).
  return AuthSession.makeRedirectUri({
    native: `${scheme}:/oauth2redirect`,
  });
}

export interface GoogleReviewsAuthResult {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

/**
 * Opens Google OAuth for Data Portability Maps reviews (authorization code + PKCE).
 * Returns the auth code for the backend to exchange — never stores tokens on device.
 */
export async function authorizeGoogleReviews(): Promise<GoogleReviewsAuthResult> {
  const clientId = getReviewsOAuthClientId();
  if (!clientId) {
    throw new Error(
      "Google OAuth is not configured. Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.",
    );
  }

  const redirectUri = getReviewsOAuthRedirectUri();

  const authRequest = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: [MAPS_REVIEWS_SCOPE],
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      access_type: "offline",
      prompt: "consent",
    },
  });

  const result = await authRequest.promptAsync({
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  });

  if (result.type !== "success" || !result.params.code) {
    if (result.type === "cancel" || result.type === "dismiss") {
      throw new Error("Google connection was cancelled");
    }
    throw new Error("Google did not return an authorization code");
  }

  const codeVerifier = authRequest.codeVerifier;
  if (!codeVerifier) {
    throw new Error("Missing PKCE code verifier after Google authorization");
  }

  return {
    code: result.params.code,
    codeVerifier,
    redirectUri,
  };
}
