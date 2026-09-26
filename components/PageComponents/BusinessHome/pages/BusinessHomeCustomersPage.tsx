import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import type { BusinessHomePersonalityRow } from '@/hooks/useBusinessHomeData';
import { ExploreInsightsSection } from '../sections/ExploreInsightsSection';
import type { BusinessHomeCustomersTabId } from '../navigation';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

interface BusinessHomeCustomersPageProps {
  personalityRows: BusinessHomePersonalityRow[];
  isPaidMember: boolean;
  onBack: () => void;
}

export function BusinessHomeCustomersPage({
  personalityRows,
  isPaidMember,
  onBack,
}: BusinessHomeCustomersPageProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] =
    useState<BusinessHomeCustomersTabId>('customers');

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
      headerBelow={
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as BusinessHomeCustomersTabId)}
          className="px-4"
        />
      }
    >
      <ExploreInsightsSection
        personalityRows={personalityRows}
        isPaidMember={isPaidMember}
        activeTab={activeTab}
        hideTabs
        hideHeading
      />
    </BusinessHomeDetailShell>
  );
}
