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
import { getAppleIdToken, getGoogleIdToken } from '../services/socialAuth';

export type SocialProvider = 'google' | 'apple';

export function useSocialAuth() {
  const { t } = useTranslation();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const unlockSession = useAuthStore((s) => s.unlockSession);

  const mutation = useMutation({
    mutationFn: async (provider: SocialProvider): Promise<signInDAO> => {
      const idToken =
        provider === 'google' ? await getGoogleIdToken() : await getAppleIdToken();

      const response =
        provider === 'google'
          ? await authService.SignInWithGoogle({ id_token: idToken })
          : await authService.SignInWithApple({ id_token: idToken });

      if (response.error || !response.data?.data) {
        throw new Error(response.error?.message ?? t('alerts.signInFailed'));
      }

      return response.data.data;
    },
    onSuccess: async (dao) => {
      await setAuth(mapSignInDaoToUser(dao), dao.token, dao.refresh_token);
      await hydrateBusinessInfo(dao.account_type);
      unlockSession();
      router.replace(getPostAuthRoute(dao.personality_name) as Href);
    },
    onError: (error: Error) => {
      const message = error.message;
      if (/cancel/i.test(message)) {
        return;
      }
      console.log({error})
      toast.error(message, { title: t('alerts.signInFailed') });
    },
  });

  return {
    signInWithProvider: (provider: SocialProvider) => mutation.mutate(provider),
    isPending: mutation.isPending,
  };
}
