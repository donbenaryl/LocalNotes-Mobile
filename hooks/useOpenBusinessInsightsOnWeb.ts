import { useCallback } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getWebAppUrl } from '@/http/environment.config';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useToastStore } from '@/stores/useToastStore';

/**
 * Opens the web Business Insights membership page in the browser.
 * Prices and payment live only on web — never call Stripe or /checkout from
 * the mobile app (Apple/Google IAP). See CLAUDE.md.
 */
export function useOpenBusinessInsightsOnWeb() {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.show);
  const businessId = useBusinessStore((s) => s.businessId);

  return useCallback(async () => {
    if (!businessId) {
      showToast({
        type: 'error',
        message: t('businessHome.upsell.openWebError'),
      });
      return;
    }

    const url = `${getWebAppUrl()}/business/insights`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      showToast({ type: 'error', message: t('businessHome.upsell.openWebError') });
      return;
    }
    await Linking.openURL(url);
  }, [businessId, showToast, t]);
}
