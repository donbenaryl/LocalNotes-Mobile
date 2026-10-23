import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { useBusinessInsights } from '@/hooks/useBusinessInsights';
import { useBusinessStore } from '@/stores/useBusinessStore';
import type { BusinessInsightsWindow } from '@/http/business-api/types';
import { getFeedTimeGroup } from '@/utils/time';
import { ExploreInsightsSection } from '../sections/ExploreInsightsSection';
import { InsightsWindowSelector } from '../ui/InsightsWindowSelector';
import type { BusinessHomeCustomersTabId } from '../navigation';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

interface BusinessHomeCustomersPageProps {
  isPaidMember: boolean;
  onBack: () => void;
}

/** Reuses the feed's time buckets (hours, yesterday, days, then a date). */
function formatUpdatedLabel(t: TFunction, computedAt: string, locale: string): string {
  const group = getFeedTimeGroup(computedAt, new Date(), locale);
  const bucket = group.i18nKey.split('.').pop();
  return t(`businessHome.explore.updated.${bucket}`, group.params);
}

export function BusinessHomeCustomersPage({
  isPaidMember,
  onBack,
}: BusinessHomeCustomersPageProps) {
  const { t, i18n } = useTranslation();
  const businessId = useBusinessStore((s) => s.businessId);
  const [activeTab, setActiveTab] =
    useState<BusinessHomeCustomersTabId>('customers');
  const [insightsWindow, setInsightsWindow] = useState<BusinessInsightsWindow>('30d');

  const { customers, demand, performance, active } = useBusinessInsights({
    businessId,
    window: insightsWindow,
    activeTab,
  });

  const tabs = useMemo<TabItem[]>(
    () => [
      { id: 'customers', label: t('businessHome.explore.customers') },
      { id: 'demand', label: t('businessHome.explore.demand') },
      { id: 'performance', label: t('businessHome.explore.performance') },
    ],
    [t],
  );

  const computedAt = active.data?.computed_at;

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.pages.customers')}
      onBack={onBack}
      refreshing={active.isRefetching && !active.isPlaceholderData}
      onRefresh={() => void active.refetch()}
      headerBelow={
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as BusinessHomeCustomersTabId)}
          className="px-4"
        />
      }
    >
      <View className="mx-4 mt-2.5 flex-row items-center justify-between gap-2">
        <Text
          className="flex-1 font-geist-semibold text-[11px] text-gray-500 dark:text-gray-400"
          numberOfLines={1}
        >
          {computedAt ? formatUpdatedLabel(t, computedAt, i18n.language) : ''}
        </Text>
        <InsightsWindowSelector value={insightsWindow} onChange={setInsightsWindow} />
      </View>
      <ExploreInsightsSection
        activeTab={activeTab}
        customers={customers}
        demand={demand}
        performance={performance}
        isPaidMember={isPaidMember}
      />
    </BusinessHomeDetailShell>
  );
}
