import { useCallback } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getWebAppUrl } from '@/http/environment.config';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useToastStore } from '@/stores/useToastStore';

/**
 * Opens the web create-offer page in the browser. Paid offer publishing must
 * never run inside the mobile app (Apple/Google IAP). See CLAUDE.md.
 */
export function useOpenCreateOfferOnWeb() {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.show);
  const businessId = useBusinessStore((s) => s.businessId);

  return useCallback(async () => {
    if (!businessId) {
      showToast({
        type: 'error',
        message: t('offerForm.validation.businessRequired'),
      });
      return;
    }

    const url = `${getWebAppUrl()}/business/offers/new`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      showToast({ type: 'error', message: t('offerForm.error') });
      return;
    }
    await Linking.openURL(url);
  }, [businessId, showToast, t]);
}
