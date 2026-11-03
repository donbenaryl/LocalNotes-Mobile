import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { useBusinessInsights } from '@/hooks/useBusinessInsights';
import { useBusinessStore } from '@/stores/useBusinessStore';
import type { BusinessInsightsWindow } from '@/http/business-api/types';
import { ExploreInsightsSection } from '../sections/ExploreInsightsSection';
import { InsightsWindowBar } from '../ui/InsightsWindowBar';
import type { BusinessHomeCustomersTabId } from '../navigation';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

interface BusinessHomeCustomersPageProps {
  isPaidMember: boolean;
  onBack: () => void;
}

export function BusinessHomeCustomersPage({
  isPaidMember,
  onBack,
}: BusinessHomeCustomersPageProps) {
  const { t } = useTranslation();
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
      <InsightsWindowBar
        computedAt={active.data?.computed_at}
        window={insightsWindow}
        onChange={setInsightsWindow}
      />
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
