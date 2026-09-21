import * as AuthSession from "expo-auth-session";
import { getGoogleWebClientId } from "@/constants/googleAuth";

const MAPS_REVIEWS_SCOPE =
  "https://www.googleapis.com/auth/dataportability.maps.reviews";

export function getReviewsOAuthRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: "localnotes",
    path: "oauth",
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
  const clientId = getGoogleWebClientId();
  if (!clientId) {
    throw new Error(
      "Google OAuth is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.",
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
      include_granted_scopes: "true",
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
