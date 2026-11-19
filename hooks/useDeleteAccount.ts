import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import accountService from '@/http/account-api/account.services';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBiometricStore } from '@/stores/useBiometricStore';
import { buildDeleteAccountDTO, deleteAccountErrorMessage } from '@/utils/deleteAccount';
import { performSessionCleanup } from '@/utils/sessionCleanup';

export type DeleteAccountVariables = { confirmText: string; password?: string };

/**
 * Deletes the signed-in account. On success: same teardown as sign-out plus the
 * biometric opt-in reset, then routes to the auth screen (/welcome, as sign-out does).
 * On failure the session is left intact and an error toast is shown.
 */
export function useDeleteAccount() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setBiometricEnabled = useBiometricStore((s) => s.setEnabled);

  return useMutation({
    mutationFn: async (vars: DeleteAccountVariables) => {
      const response = await accountService.deleteAccount(buildDeleteAccountDTO(vars));
      if (response.error) throw response.error;
    },
    onSuccess: async () => {
      try {
        await performSessionCleanup(
          {
            removeProfileQuery: () => queryClient.removeQueries({ queryKey: ['profile'] }),
            clearAuth,
            setBiometricEnabled,
          },
          { resetBiometric: true },
        );
      } catch (error) {
        // Account is already deleted server-side; a local cleanup failure must not
        // surface as a "deletion failed" toast via onError.
        console.warn('Session cleanup after account deletion failed', error);
      } finally {
        // Always leave the authenticated area.
        toast.info(t('accountSettings.menu.deleteAccountSuccess'));
        router.replace('/welcome');
      }
    },
    onError: (error) => {
      toast.error(
        deleteAccountErrorMessage(error, t('accountSettings.menu.deleteAccountFailed')),
        { title: t('alerts.error') },
      );
    },
  });
}
