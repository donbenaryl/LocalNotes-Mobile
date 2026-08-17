import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { AppRefreshControl } from '@/components/ui/AppRefreshControl';
import { useAuthStore } from '@/stores/useAuthStore';
import { isBusinessAccountType } from '@/utils/businessAccount';
import { useBusinessHomeData } from '@/hooks/useBusinessHomeData';
import { BusinessHomeHeader } from './BusinessHomeHeader';
import { BusinessHomeShortcuts } from './BusinessHomeShortcuts';
import { BusinessHomeTopline } from './BusinessHomeTopline';
import { InsightSummarySection } from './sections/InsightSummarySection';
import { ThisWeekSection } from './sections/ThisWeekSection';
import { AlertsSection } from './sections/AlertsSection';
import { NextActionsSection } from './sections/NextActionsSection';
import { InsightsToolsSection } from './sections/InsightsToolsSection';
import { HowPeopleFindYouSection } from './sections/HowPeopleFindYouSection';
import { CampaignResultsSection } from './sections/CampaignResultsSection';
import {
  ProfileHealthSection,
  RunAnotherCampaignSection,
} from './sections/FreeCampaignSections';
import { LocationsSection } from './sections/LocationsSection';
import { ExploreInsightsSection } from './sections/ExploreInsightsSection';
import {
  FooterNoteSection,
  MonthlyReportSection,
  UpsellSection,
} from './sections/MonthlyReportSection';
import { BusinessHomeSheets } from './sheets/BusinessHomeSheets';
import type { BusinessHomeSheetId } from './sheets/types';

export default function BusinessHomeScreen() {
  const router = useRouter();
  const accountType = useAuthStore((s) => s.accountType ?? s.user?.accountType);
  const {
    businessName,
    locationName,
    managerName,
    roleLabel,
    periodLabel,
    dateFrom,
    dateTo,
    onDateRangeChange,
    topline,
    personalityRows,
    locationRows,
    isPaidMember,
    togglePaidMember,
    isLoading,
    isRefetching,
    refetchAll,
  } = useBusinessHomeData();

  const [activeSheet, setActiveSheet] = useState<BusinessHomeSheetId | null>(null);

  useEffect(() => {
    if (!isBusinessAccountType(accountType ?? undefined)) {
      router.replace('/profile' as never);
    }
  }, [accountType, router]);

  const openSheet = (id: BusinessHomeSheetId) => setActiveSheet(id);

  if (!isBusinessAccountType(accountType ?? undefined)) {
    return null;
  }

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <BusinessHomeHeader
        businessName={businessName}
        locationName={locationName}
        managerName={managerName}
        roleLabel={roleLabel}
        periodLabel={periodLabel}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateRangeChange={onDateRangeChange}
        onBack={() => router.back()}
        onToggleMembership={togglePaidMember}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B1A" />
        </View>
      ) : (
        <AppScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-4"
          refreshControl={
            <AppRefreshControl refreshing={isRefetching} onRefresh={refetchAll} />
          }
        >
          <BusinessHomeShortcuts />
          <BusinessHomeTopline {...topline} />
          <InsightSummarySection isPaidMember={isPaidMember} />
          <ThisWeekSection isPaidMember={isPaidMember} />
          <AlertsSection isPaidMember={isPaidMember} />
          <NextActionsSection isPaidMember={isPaidMember} onOpenSheet={openSheet} />
          <InsightsToolsSection isPaidMember={isPaidMember} onOpenSheet={openSheet} />
          <HowPeopleFindYouSection />
          <CampaignResultsSection isPaidMember={isPaidMember} onOpenSheet={openSheet} />
          <RunAnotherCampaignSection isPaidMember={isPaidMember} />
          <ProfileHealthSection isPaidMember={isPaidMember} />
          <LocationsSection locationRows={locationRows} isPaidMember={isPaidMember} />
          <ExploreInsightsSection
            personalityRows={personalityRows}
            isPaidMember={isPaidMember}
          />
          <MonthlyReportSection isPaidMember={isPaidMember} onOpenSheet={openSheet} />
          <UpsellSection isPaidMember={isPaidMember} />
          <FooterNoteSection />
        </AppScrollView>
      )}

      <BusinessHomeSheets
        activeSheet={activeSheet}
        onClose={() => setActiveSheet(null)}
      />
    </View>
  );
}
