import accountService from '../http/account-api/account.services';
import { useAuthStore } from '../stores/useAuthStore';
import { mapProfileToUser } from '../utils/mapProfileToUser';
import { getPostAuthRoute } from '../utils/personality';

export async function hydrateUserProfile(): Promise<boolean> {
  const response = await accountService.fetchUser();
  if (response.error || !response.data?.data) {
    return false;
  }

  const user = mapProfileToUser(response.data.data);
  useAuthStore.setState({
    user,
    accountType: user.accountType,
  });
  return true;
}

export async function bootstrapSession(): Promise<
  '/sign-in' | '/personality' | '/home'
> {
  await useAuthStore.getState().loadToken();
  const { isAuthenticated } = useAuthStore.getState();

  if (!isAuthenticated) {
    return '/sign-in';
  }

  const hydrated = await hydrateUserProfile();
  if (!hydrated) {
    await useAuthStore.getState().clearAuth();
    return '/sign-in';
  }

  const personalityName = useAuthStore.getState().user?.personalityName;
  return getPostAuthRoute(personalityName);
}
