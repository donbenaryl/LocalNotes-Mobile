import type { QueryClient } from '@tanstack/react-query';
import accountService from '../http/account-api/account.services';
import type { profileItemDAO } from '../http/account-api/types';
import { useAuthStore } from '../stores/useAuthStore';
import { useBusinessStore } from '../stores/useBusinessStore';
import { useBiometricStore } from '../stores/useBiometricStore';
import { authenticateWithBiometrics } from './biometricAuth';
import { mapProfileToUser } from '../utils/mapProfileToUser';
import { isBusinessAccountType } from '../utils/businessAccount';
import { getPostAuthRoute } from '../utils/personality';

export async function hydrateBusinessInfo(
  accountType: string | undefined,
): Promise<void> {
  if (!isBusinessAccountType(accountType)) return;
  await useBusinessStore.getState().loadBusinessInfo();
}

export async function syncSessionFromProfile(
  profile: profileItemDAO,
  queryClient?: QueryClient,
): Promise<void> {
  const user = mapProfileToUser(profile);
  useAuthStore.setState({
    user,
    accountType: user.accountType,
  });

  if (queryClient) {
    queryClient.setQueryData(['profile'], profile);
  }

  if (isBusinessAccountType(profile.account_type)) {
    await useBusinessStore.getState().refreshBusinessInfo();
    await useBusinessStore.getState().loadOwnedBusinesses();

    const businessInfo = useBusinessStore.getState().businessInfo;
    if (queryClient && businessInfo?.id) {
      queryClient.setQueryData(['business-info', businessInfo.id], businessInfo);
    }
  }

  if (queryClient) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['profile-picks'] }),
      queryClient.invalidateQueries({ queryKey: ['profile-lists'] }),
      queryClient.invalidateQueries({ queryKey: ['profile-other-lists'] }),
      queryClient.invalidateQueries({ queryKey: ['profile-business-lists'] }),
      queryClient.invalidateQueries({ queryKey: ['business-stats-lists-month'] }),
      queryClient.invalidateQueries({
        queryKey: ['business-stats-personality-colors'],
      }),
      queryClient.invalidateQueries({ queryKey: ['business-home-views'] }),
      queryClient.invalidateQueries({ queryKey: ['business-info'] }),
    ]);
  }
}

export async function hydrateUserProfile(
  queryClient?: QueryClient,
): Promise<boolean> {
  const response = await accountService.fetchUser();
  if (response.error || !response.data?.data) {
    return false;
  }

  await syncSessionFromProfile(response.data.data, queryClient);
  return true;
}

export async function bootstrapSession(): Promise<
  '/sign-in' | '/personality' | '/home'
> {
  await useAuthStore.getState().loadToken();
  await useBiometricStore.getState().load();

  const { isAuthenticated, unlockSession, lockSession } = useAuthStore.getState();
  const biometricEnabled = useBiometricStore.getState().enabled;

  if (!isAuthenticated) {
    return '/sign-in';
  }

  if (biometricEnabled) {
    const unlocked = await authenticateWithBiometrics(
      'Unlock LocalNotes',
    );
    if (!unlocked) {
      lockSession();
      return '/sign-in';
    }
  }

  unlockSession();

  const hydrated = await hydrateUserProfile();
  if (!hydrated) {
    await useAuthStore.getState().clearAuth();
    return '/sign-in';
  }

  const personalityName = useAuthStore.getState().user?.personalityName;
  return getPostAuthRoute(personalityName);
}
