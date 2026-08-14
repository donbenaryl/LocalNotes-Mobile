import accountService from '../http/account-api/account.services';
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

export async function hydrateUserProfile(): Promise<boolean> {
  const response = await accountService.fetchUser();
  if (response.error || !response.data?.data) {
    return false;
  }

  const profile = response.data.data;
  const user = mapProfileToUser(profile);
  useAuthStore.setState({
    user,
    accountType: user.accountType,
  });
  await hydrateBusinessInfo(profile.account_type);
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
