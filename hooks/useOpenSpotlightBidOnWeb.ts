import { useCallback } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getWebAppUrl } from '@/http/environment.config';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { useToastStore } from '@/stores/useToastStore';

/**
 * Opens the web Spotlight bid page. Bidding and payment live only on web —
 * never call Stripe or /checkout from mobile (Apple/Google IAP). See CLAUDE.md.
 */
export function useOpenSpotlightBidOnWeb() {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.show);
  const businessId = useBusinessStore((s) => s.businessId);

  return useCallback(async () => {
    const message = t('businessHome.promoteTab.spotlightOpenWebError');
    if (!businessId) {
      showToast({ type: 'error', message });
      return;
    }
    const url = `${getWebAppUrl()}/business/spotlight`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      showToast({ type: 'error', message });
      return;
    }
    await Linking.openURL(url);
  }, [businessId, showToast, t]);
}
