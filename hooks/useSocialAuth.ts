import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import authService from '../http/auth-api/auth.service';
import type { signInDAO } from '../http/auth-api/types';
import { useAuthStore } from '../stores/useAuthStore';
import { mapSignInDaoToUser } from '../utils/mapProfileToUser';
import { getPostAuthRoute } from '../utils/personality';
import { hydrateBusinessInfo } from '../services/authBootstrap';
import { toast } from '../components/ui/Toast';
import { getAppleSignIn, getGoogleSignIn } from '../services/socialAuth';
import { usernameBaseFromName } from '../utils/usernameSuggestions';

export type SocialProvider = 'google' | 'apple';

export type SocialAuthResult = {
  dao: signInDAO;
  suggestedUsername: string;
  needsProfileCompletion: boolean;
};

function needsProfileCompletion(dao: signInDAO): boolean {
  return !dao.date_of_birth;
}

type UseSocialAuthOptions = {
  /**
   * When set, new social accounts that still need DOB/username stay on the
   * caller instead of navigating away (used by the sign-up screen).
   */
  onNeedsProfileCompletion?: (result: SocialAuthResult) => void;
};

export function useSocialAuth(options: UseSocialAuthOptions = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const unlockSession = useAuthStore((s) => s.unlockSession);
  const { onNeedsProfileCompletion } = options;

  const mutation = useMutation({
    mutationFn: async (provider: SocialProvider): Promise<SocialAuthResult> => {
      const social =
        provider === 'google' ? await getGoogleSignIn() : await getAppleSignIn();

      const response =
        provider === 'google'
          ? await authService.SignInWithGoogle({ id_token: social.idToken })
          : await authService.SignInWithApple({ id_token: social.idToken });

      if (response.error || !response.data?.data) {
        throw new Error(response.error?.message ?? t('alerts.signInFailed'));
      }

      const dao = response.data.data;
      const suggestedUsername = usernameBaseFromName(
        social.displayName || dao.name || dao.email || '',
      );

      return {
        dao,
        suggestedUsername,
        needsProfileCompletion: needsProfileCompletion(dao),
      };
    },
    onSuccess: async (result) => {
      const { dao } = result;
      await setAuth(mapSignInDaoToUser(dao), dao.token, dao.refresh_token);
      await hydrateBusinessInfo(dao.account_type);
      unlockSession();

      if (result.needsProfileCompletion) {
        if (onNeedsProfileCompletion) {
          onNeedsProfileCompletion(result);
          return;
        }
        router.replace({
          pathname: '/sign-up',
          params: {
            socialComplete: '1',
            suggestedUsername: result.suggestedUsername,
          },
        } as Href);
        return;
      }

      router.replace(getPostAuthRoute(dao.personality_name) as Href);
    },
    onError: (error: Error) => {
      const message = error.message;
      if (/cancel/i.test(message)) {
        return;
      }
      console.log({ error });
      toast.error(message, { title: t('alerts.signInFailed') });
    },
  });

  return {
    signInWithProvider: (provider: SocialProvider) => mutation.mutate(provider),
    isPending: mutation.isPending,
  };
}
