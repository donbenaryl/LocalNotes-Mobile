import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/Skeleton';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { useCampaignResults } from '@/hooks/useCampaignResults';
import { useOpenCreateOfferOnWeb } from '@/hooks/useOpenCreateOfferOnWeb';
import { useBusinessStore } from '@/stores/useBusinessStore';
import type { CampaignResultsItemDAO } from '@/http/business-api/types';
import { formatSpendCents } from '@/utils/campaignResults';
import { formatRelativeTime } from '@/utils/time';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';
import type { BusinessHomeSheetId } from '../sheets/types';

interface CampaignResultsSectionProps {
  isPaidMember: boolean;
  onOpenSheet: (id: BusinessHomeSheetId) => void;
}

function statusLabel(
  campaign: CampaignResultsItemDAO,
  t: (key: string, params?: Record<string, string>) => string,
): string {
  if (campaign.status === 'ended' && campaign.ended_at) {
    return t('businessHome.campaign.statusEnded', {
      when: formatRelativeTime(campaign.ended_at),
    });
  }
  if (campaign.status === 'ended') {
    return t('businessHome.campaign.statusEndedFallback');
  }
  return t('businessHome.campaign.statusActive');
}

export function CampaignResultsSection({
  isPaidMember,
  onOpenSheet,
}: CampaignResultsSectionProps) {
  const { t } = useTranslation();
  const businessId = useBusinessStore((s) => s.businessId);
  const { campaign, isLoading, isError, refetch } = useCampaignResults(
    businessId || undefined,
  );
  const openCreateOfferOnWeb = useOpenCreateOfferOnWeb();

  const renderBody = () => {
    if (isLoading) {
      return (
        <View className="gap-2">
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="mt-2 h-10 w-full" />
        </View>
      );
    }

    if (isError) {
      return (
        <View>
          <Text className="font-geist text-[13.5px] text-gray-600 dark:text-gray-400">
            {t('businessHome.campaign.loadError')}
          </Text>
          <View className="mt-2.5 flex-row">
            <LocalNotesButton
              label={t('common.retry')}
              onPress={() => void refetch()}
              variant="light"
              size="sm"
              isWidthFull={false}
            />
          </View>
        </View>
      );
    }

    if (!campaign) {
      return (
        <Text className="font-geist text-[13.5px] leading-[1.55] text-gray-600 dark:text-gray-400">
          {t('businessHome.campaign.empty')}
        </Text>
      );
    }

    const metrics = [
      {
        value: formatSpendCents(campaign.spend_cents, campaign.currency),
        label: t('businessHome.campaign.spend'),
      },
      {
        value: String(campaign.redeemed),
        label: t('businessHome.campaign.redeemed'),
      },
      {
        value: '—',
        label: t('businessHome.campaign.sales'),
      },
      {
        value: '—',
        label: t('businessHome.campaign.roas'),
      },
    ];

    return (
      <>
        <Text className="font-geist-extrabold text-[10.5px] uppercase tracking-wide text-brand dark:text-gray-100">
          {statusLabel(campaign, t)}
        </Text>
        <Text className="mt-1 font-geist-extrabold text-[15px] text-ink dark:text-gray-100">
          {campaign.name}
        </Text>
        <View className="mt-3 flex-row">
          {metrics.map((item, index) => (
            <View
              key={item.label}
              className={`flex-1 ${index > 0 ? 'border-l border-gray-100 pl-2.5 dark:border-gray-700' : ''}`}
            >
              <Text className="font-geist-extrabold text-lg text-ink dark:text-gray-100">
                {item.value}
              </Text>
              <Text className="mt-0.5 font-geist-bold text-[9.5px] uppercase text-gray-500 dark:text-gray-400">
                {item.label}
              </Text>
            </View>
          ))}
        </View>
        <View className="mt-2.5 flex-row flex-wrap gap-1.5">
          <LocalNotesButton
            label={t('businessHome.buttons.runAgain')}
            onPress={() => void openCreateOfferOnWeb()}
            variant="brand"
            size="sm"
            isWidthFull={false}
          />
          <LocalNotesButton
            label={t('businessHome.buttons.editRelaunch')}
            onPress={() => void openCreateOfferOnWeb()}
            variant="light"
            size="sm"
            isWidthFull={false}
          />
        </View>
        <View className="mt-2.5 flex-row flex-wrap gap-1.5">
          <LocalNotesButton
            label={t('businessHome.campaign.viewSnapshot')}
            onPress={() => onOpenSheet('snapshot')}
            variant="ghost"
            size="sm"
            isWidthFull={false}
          />
          <LocalNotesButton
            label={t('businessHome.campaign.campaignSetup')}
            onPress={() => onOpenSheet('setup')}
            variant="ghost"
            size="sm"
            isWidthFull={false}
          />
        </View>
        <MembershipGate isPaidMember={isPaidMember} tier="free">
          <Text className="mt-2 border-t border-gray-100 pt-2 font-geist text-[11px] leading-[1.55] text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <Text className="font-geist-bold text-brand dark:text-gray-100">
              {t('businessHome.campaign.unlockInsights')}
            </Text>
          </Text>
        </MembershipGate>
        <MembershipGate isPaidMember={isPaidMember} tier="paid">
          <Text className="mt-2 border-t border-gray-100 pt-2 font-geist text-[11px] leading-[1.55] text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {t('businessHome.campaign.paidNote')}{' '}
          </Text>
          {/* Compare Campaign Button */}
          <Text
            onPress={() => onOpenSheet('compare')}
            className="font-geist-extrabold text-[11px] text-brand dark:text-gray-100 underline"
          >
            {t('businessHome.campaign.compare')}
          </Text>
        </MembershipGate>
      </>
    );
  };

  return (
    <>
      <SectionHeading title={t('businessHome.sections.campaignResults')} />
      <BusinessHomeCard>{renderBody()}</BusinessHomeCard>
      {!isLoading && !isError && !campaign ? (
        <View className="mx-4 mt-2">
          <Pressable
            onPress={() => void openCreateOfferOnWeb()}
            accessibilityRole="button"
            className="active:opacity-80"
          >
            <Text className="font-geist-semibold text-xs text-brand dark:text-gray-100">
              {t('businessHome.campaign.createOffer')}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
}
