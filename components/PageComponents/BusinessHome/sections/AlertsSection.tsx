import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useBusinessAlerts } from '@/hooks/useBusinessAlerts';
import { useOpenBusinessInsightsOnWeb } from '@/hooks/useOpenBusinessInsightsOnWeb';
import { useOpenCreateOfferOnWeb } from '@/hooks/useOpenCreateOfferOnWeb';
import { useBusinessStore } from '@/stores/useBusinessStore';
import type { BusinessAlertDAO } from '@/http/business-api/types';
import {
  resolveAlertAction,
  getAlertVisual,
  resolveAlertCopy,
  unreadAlertIds,
  type BusinessAlertAction,
} from '@/utils/businessAlerts';
import { cn } from '@/utils/cn';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';

/** How long the section stays on screen before its alerts count as seen. */
const MARK_READ_DELAY_MS = 1000;

interface AlertsSectionProps {
  isPaidMember: boolean;
  onOpenCustomers?: () => void;
  onOpenCampaign?: () => void;
}

export function AlertsSection({
  isPaidMember,
  onOpenCustomers,
  onOpenCampaign,
}: AlertsSectionProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const openBusinessInsightsOnWeb = useOpenBusinessInsightsOnWeb();
  const openCreateOfferOnWeb = useOpenCreateOfferOnWeb();
  const businessId = useBusinessStore((s) => s.businessId);
  const businessType = useBusinessStore((s) => s.businessInfo?.business_type ?? '');
  const { query, markRead, dismiss } = useBusinessAlerts({ businessId, isPaidMember });
  const alerts = query.data?.alerts;
  const { mutate: markAlertRead } = markRead;

  useEffect(() => {
    if (!query.data) return;
    const ids = unreadAlertIds(query.data);
    if (ids.length === 0) return;
    const timer = setTimeout(() => ids.forEach((id) => markAlertRead(id)), MARK_READ_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query.data, markAlertRead]);

  const runAction = useCallback(
    (action: BusinessAlertAction) => {
      switch (action.kind) {
        case 'create_offer_web':
          void openCreateOfferOnWeb();
          break;
        case 'edit_profile':
        case 'edit_hours':
          router.push('/edit-profile');
          break;
        case 'thank_you':
          router.push('/thank-you');
          break;
        case 'open_customers':
          onOpenCustomers?.();
          break;
        case 'open_campaign':
          onOpenCampaign?.();
          break;
        case 'none':
          break;
      }
    },
    [openCreateOfferOnWeb, router, onOpenCustomers, onOpenCampaign],
  );

  const renderAlert = (alert: BusinessAlertDAO) => {
    const copy = resolveAlertCopy(alert, t, (key) => i18n.exists(key), businessType);
    const action = resolveAlertAction(alert);
    const ctaLabel =
      action.kind === 'none' ? null : t(`businessHome.alert.cta.${action.kind}`);

    const visual = getAlertVisual(alert);
    const AlertIcon = visual.icon;

    return (
      <BusinessHomeCard
        key={alert.id}
        className={cn('mb-2', alert.severity === 'important' && visual.accentClass)}
      >
        <View className="flex-row gap-3">
          <View
            className={cn(
              'h-9 w-9 items-center justify-center rounded-full',
              visual.badgeClass,
            )}
          >
            <AlertIcon size={18} color={visual.iconColor} />
            {!alert.read_at ? (
              <View className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand dark:border-gray-900" />
            ) : null}
          </View>
          <View className="flex-1">
            <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
              {copy.what}
            </Text>
            <Text className="mt-1 font-geist text-xs leading-[1.55] text-gray-600 dark:text-gray-400">
              {copy.why} {copy.action}
            </Text>
            <View className="mt-2.5 flex-row flex-wrap gap-1.5">
              {ctaLabel ? (
                <LocalNotesButton
                  label={ctaLabel}
                  onPress={() => {
                    if (!alert.read_at) markAlertRead(alert.id);
                    runAction(action);
                  }}
                  variant="dark"
                  size="sm"
                  isWidthFull={false}
                />
              ) : null}
              <LocalNotesButton
                label={t('businessHome.alert.dismiss')}
                onPress={() => dismiss.mutate(alert.id)}
                variant="ghost"
                size="sm"
                isWidthFull={false}
              />
            </View>
          </View>
        </View>
      </BusinessHomeCard>
    );
  };

  return (
    <>
      <MembershipGate isPaidMember={isPaidMember} tier="paid">
        <SectionHeading title={t('businessHome.sections.alerts')} />
        {query.isPending ? (
          <View className="items-center py-6">
            <ActivityIndicator color="#FF6B1A" />
          </View>
        ) : query.isError ? (
          <BusinessHomeCard>
            <Text className="font-geist text-xs text-gray-600 dark:text-gray-400">
              {t('businessHome.alert.error')}
            </Text>
            <LocalNotesButton
              label={t('businessHome.alert.retry')}
              onPress={() => void query.refetch()}
              variant="light"
              size="sm"
              isWidthFull={false}
              className="mt-2"
            />
          </BusinessHomeCard>
        ) : alerts && alerts.length > 0 ? (
          alerts.map(renderAlert)
        ) : (
          <BusinessHomeCard>
            <Text className="font-geist text-xs leading-[1.5] text-gray-600 dark:text-gray-400">
              {t('businessHome.alert.empty')}
            </Text>
          </BusinessHomeCard>
        )}
      </MembershipGate>

      <MembershipGate isPaidMember={isPaidMember} tier="free">
        <SectionHeading title={t('businessHome.sections.alerts')} />
        <BusinessHomeCard variant="upsell">
          <Text className="font-geist-extrabold text-[15px] text-ink dark:text-gray-100">
            {t('businessHome.alert.membersOnlyTitle')}
          </Text>
          <Text className="mt-1 font-geist text-xs leading-[1.5] text-gray-600 dark:text-gray-400">
            {t('businessHome.alert.membersOnlyBody')}
          </Text>
          <LocalNotesButton
            label={t('businessHome.upsell.continueOnWeb')}
            onPress={() => void openBusinessInsightsOnWeb()}
            variant="brand"
            size="sm"
            className="mt-3 justify-center"
          />
        </BusinessHomeCard>
      </MembershipGate>
    </>
  );
}
