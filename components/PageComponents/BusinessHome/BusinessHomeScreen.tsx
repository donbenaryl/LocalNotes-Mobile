import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { isBusinessAccountType } from '@/utils/businessAccount';
import { useBusinessHomeData } from '@/hooks/useBusinessHomeData';
import { useBusinessHomeNav } from './navigation';
import { BusinessHomeSheets } from './sheets/BusinessHomeSheets';
import type { BusinessHomeSheetId } from './sheets/types';
import { BusinessHomeProfilePage } from './pages/BusinessHomeProfilePage';
import { BusinessHomeOverviewPage } from './pages/BusinessHomeOverviewPage';
import { BusinessHomeFindYouPage } from './pages/BusinessHomeFindYouPage';
import { BusinessHomeLocationsPage } from './pages/BusinessHomeLocationsPage';
import { BusinessHomeCustomersPage } from './pages/BusinessHomeCustomersPage';
import { BusinessHomeMembershipPage } from './pages/BusinessHomeMembershipPage';
import { BusinessHomeCampaignPage } from './pages/BusinessHomeCampaignPage';
import { BusinessHomeSpotlightPage } from './pages/BusinessHomeSpotlightPage';

export default function BusinessHomeScreen() {
  const router = useRouter();
  const accountType = useAuthStore((s) => s.accountType ?? s.user?.accountType);
  const {
    businessName,
    businessLogo,
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

  const { page, push, pop, canPop } = useBusinessHomeNav('profile');
  const [activeSheet, setActiveSheet] = useState<BusinessHomeSheetId | null>(
    null,
  );

  useEffect(() => {
    if (!isBusinessAccountType(accountType ?? undefined)) {
      router.replace('/profile' as never);
    }
  }, [accountType, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeSheet) {
        setActiveSheet(null);
        return true;
      }
      if (canPop) {
        pop();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [activeSheet, canPop, pop]);

  const openSheet = (id: BusinessHomeSheetId) => setActiveSheet(id);

  const handleRootBack = () => {
    if (canPop) {
      pop();
      return;
    }
    router.back();
  };

  if (!isBusinessAccountType(accountType ?? undefined)) {
    return null;
  }

  if (isLoading) {
    return (
      <View
        style={styles.root}
        className="items-center justify-center bg-page dark:bg-gray-900"
      >
        <ActivityIndicator size="large" color="#FF6B1A" />
      </View>
    );
  }

  let content: ReactNode = null;

  switch (page) {
    case 'profile':
      content = (
        <BusinessHomeProfilePage
          businessName={businessName}
          businessLogo={businessLogo}
          locationName={locationName}
          managerName={managerName}
          roleLabel={roleLabel}
          topline={topline}
          periodLabel={periodLabel}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateRangeChange={onDateRangeChange}
          isPaidMember={isPaidMember}
          isRefetching={isRefetching}
          onRefresh={refetchAll}
          onBack={handleRootBack}
          onToggleMembership={togglePaidMember}
          onOpenSheet={openSheet}
          onOpenFullInsights={() => push('overview')}
          onOpenCampaign={() => push('campaign')}
        />
      );
      break;
    case 'overview':
      content = (
        <BusinessHomeOverviewPage
          topline={topline}
          periodLabel={periodLabel}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateRangeChange={onDateRangeChange}
          isPaidMember={isPaidMember}
          isRefetching={isRefetching}
          onRefresh={refetchAll}
          onBack={pop}
          onOpenSheet={openSheet}
          onOpenFindYou={() => push('findyou')}
          onOpenLocations={() => push('locations')}
          onOpenCustomers={() => push('customers')}
          onOpenMembership={() => push('membership')}
          onOpenCampaign={() => push('campaign')}
          onOpenSpotlight={() => push('spotlight')}
          leadingLocationName={locationRows[0]?.name}
        />
      );
      break;
    case 'findyou':
      content = (
        <BusinessHomeFindYouPage onBack={pop} periodLabel={periodLabel} />
      );
      break;
    case 'locations':
      content = (
        <BusinessHomeLocationsPage
          locationRows={locationRows}
          isPaidMember={isPaidMember}
          onBack={pop}
        />
      );
      break;
    case 'customers':
      content = (
        <BusinessHomeCustomersPage
          personalityRows={personalityRows}
          isPaidMember={isPaidMember}
          onBack={pop}
        />
      );
      break;
    case 'membership':
      content = (
        <BusinessHomeMembershipPage
          isPaidMember={isPaidMember}
          onBack={pop}
        />
      );
      break;
    case 'campaign':
      content = (
        <BusinessHomeCampaignPage
          isPaidMember={isPaidMember}
          onBack={pop}
          onOpenSheet={openSheet}
        />
      );
      break;
    case 'spotlight':
      content = <BusinessHomeSpotlightPage onBack={pop} />;
      break;
    default:
      content = null;
  }

  return (
    <View style={styles.root} className="bg-page dark:bg-gray-900">
      {content}
      <BusinessHomeSheets
        activeSheet={activeSheet}
        onClose={() => setActiveSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
