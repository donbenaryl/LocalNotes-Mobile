import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { DateRangePicker } from '../ui/DateRangePicker';
import { DetailNavRow } from '../ui/DetailNavRow';
import { SectionHeading } from '../ui/SectionHeading';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { BusinessHomeTopline } from '../BusinessHomeTopline';
import { BusinessInsightsSections } from '../sections/BusinessInsightsSections';
import { InsightsToolsSection } from '../sections/InsightsToolsSection';
import { RunAnotherCampaignSection } from '../sections/FreeCampaignSections';
import {
  FooterNoteSection,
  MonthlyReportSection,
} from '../sections/MonthlyReportSection';
import { useOpenCreateOfferOnWeb } from '@/hooks/useOpenCreateOfferOnWeb';
import { BUSINESS_HOME_CAMPAIGN, BUSINESS_HOME_DISCOVERY } from '@/constants/businessHomeMock';
import type { BusinessHomeOverviewTabId } from '../navigation';
import type { BusinessHomeSheetId } from '../sheets/types';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';
import { ThisWeekSection } from '../sections/ThisWeekSection';
import { NextActionsSection } from '../sections/NextActionsSection';

interface BusinessHomeOverviewPageProps {
  topline: {
    views: string;
    saves: string;
    redeemed: string;
    lists: string;
  };
  periodLabel: string;
  dateFrom: string;
  dateTo: string;
  onDateRangeChange: (range: { dateFrom: string; dateTo: string }) => void;
  isPaidMember: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
  onBack: () => void;
  onOpenSheet: (id: BusinessHomeSheetId) => void;
  onOpenFindYou: () => void;
  onOpenLocations: () => void;
  onOpenCustomers: () => void;
  onOpenMembership: () => void;
  onOpenCampaign: () => void;
  onOpenSpotlight: () => void;
  leadingLocationName?: string;
}

export function BusinessHomeOverviewPage({
  topline,
  periodLabel,
  dateFrom,
  dateTo,
  onDateRangeChange,
  isPaidMember,
  isRefetching,
  onRefresh,
  onBack,
  onOpenSheet,
  onOpenFindYou,
  onOpenLocations,
  onOpenCustomers,
  onOpenMembership,
  onOpenCampaign,
  onOpenSpotlight,
  leadingLocationName,
}: BusinessHomeOverviewPageProps) {
  const { t } = useTranslation();
  const openCreateOfferOnWeb = useOpenCreateOfferOnWeb();
  const [activeTab, setActiveTab] =
    useState<BusinessHomeOverviewTabId>('overview');

  const tabs = useMemo<TabItem[]>(
    () => [
      { id: 'overview', label: t('businessHome.tabs.overview') },
      { id: 'promote', label: t('businessHome.tabs.promote') },
      { id: 'analytics', label: t('businessHome.tabs.analytics') },
    ],
    [t],
  );

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.pages.insights')}
      onBack={onBack}
      refreshing={isRefetching}
      onRefresh={onRefresh}
      rightChild={
        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          displayValue={periodLabel}
          onChange={onDateRangeChange}
        />
      }
      headerBelow={
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as BusinessHomeOverviewTabId)}
          className="mx-4"
        />
      }
    >
      {activeTab === 'overview' ? (
        <View className="pt-2">
          <BusinessHomeTopline {...topline} />
          <BusinessInsightsSections
            isPaidMember={isPaidMember}
          />
          <ThisWeekSection isPaidMember={isPaidMember} />
          <NextActionsSection
            isPaidMember={isPaidMember}
            onOpenSheet={onOpenSheet}
          />

          <SectionHeading title={t('businessHome.details.section')} />
          <DetailNavRow
            title={t('businessHome.details.howPeopleFindYou')}
            previewLabel={t('businessHome.details.howPeopleFindYouPreview')}
            previewValue={`Search · ${BUSINESS_HOME_DISCOVERY.search}`}
            onPress={onOpenFindYou}
            className="mb-2.5"
          />
          <DetailNavRow
            title={t('businessHome.details.locations')}
            previewLabel={t('businessHome.details.locationsPreview')}
            previewValue={leadingLocationName}
            onPress={onOpenLocations}
            className="mb-2.5"
          />
          <DetailNavRow
            title={t('businessHome.details.customers')}
            previewLabel={t('businessHome.details.customersPreview')}
            onPress={onOpenCustomers}
            className="mb-2.5"
          />

          <SectionHeading title={t('businessHome.pages.membership')} />
          <DetailNavRow
            title={t('businessHome.details.membership')}
            previewLabel={t('businessHome.details.membershipPreview')}
            onPress={onOpenMembership}
          />
          <FooterNoteSection />
        </View>
      ) : null}

      {activeTab === 'promote' ? (
        <View className="pt-1">
          <SectionHeading
            title={t('businessHome.promoteTab.currentlyPromoting')}
          />
          <BusinessHomeCard className="mb-1">
            <Pressable
              onPress={onOpenCampaign}
              accessibilityRole="button"
              className="active:opacity-70"
            >
              <Text className="font-geist-semibold text-sm text-ink dark:text-gray-100">
                {BUSINESS_HOME_CAMPAIGN.name}
              </Text>
              <View className="mt-1 flex-row items-center justify-between gap-2">
                <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                  {BUSINESS_HOME_CAMPAIGN.status}
                </Text>
                <Text className="font-geist-bold text-xs text-success">
                  {BUSINESS_HOME_CAMPAIGN.roas} ROAS
                </Text>
              </View>
            </Pressable>
          </BusinessHomeCard>
          <Text className="px-5 pb-2 font-geist text-xs leading-[1.5] text-gray-500 dark:text-gray-400">
            {t('businessHome.promoteTab.promoteNote')}
          </Text>

          <SectionHeading title={t('businessHome.promoteTab.spotlight')} />
          <BusinessHomeCard className="mb-1">
            <Pressable
              onPress={onOpenSpotlight}
              accessibilityRole="button"
              className="active:opacity-70"
            >
              <Text className="font-geist-semibold text-sm text-ink dark:text-gray-100">
                {t('businessHome.promoteTab.spotlightTitle')}
              </Text>
              <View className="mt-1 flex-row items-center justify-between gap-2">
                <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
                  {t('businessHome.promoteTab.spotlightMeta')}
                </Text>
                <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
                  {t('businessHome.promoteTab.spotlightBid')}
                </Text>
              </View>
            </Pressable>
          </BusinessHomeCard>
          <Text className="px-5 pb-3 font-geist text-xs leading-[1.5] text-gray-500 dark:text-gray-400">
            {t('businessHome.promoteTab.spotlightNote')}
          </Text>

          <RunAnotherCampaignSection isPaidMember={isPaidMember} />
        </View>
      ) : null}

      {activeTab === 'analytics' ? (
        <View className="pt-2">
          <Text className="px-5 pb-3 font-geist text-xs leading-[1.5] text-gray-500 dark:text-gray-400">
            {t('businessHome.analyticsTab.empty')}
          </Text>
          <InsightsToolsSection
            isPaidMember={isPaidMember}
            onOpenSheet={onOpenSheet}
          />
          <MonthlyReportSection
            isPaidMember={isPaidMember}
            onOpenSheet={onOpenSheet}
          />
          <FooterNoteSection />
        </View>
      ) : null}
    </BusinessHomeDetailShell>
  );
}
