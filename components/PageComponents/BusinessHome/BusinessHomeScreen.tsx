import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { isBusinessAccountType } from '@/utils/businessAccount';
import { useBusinessHomeData } from '@/hooks/useBusinessHomeData';
import { useBusinessHomeNav } from './navigation';
import { parseBusinessHomePage, parseBusinessHomeTab } from '@/utils/pushDeepLink';
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
import { AskCopilotFab } from './ui/AskCopilotFab';

const SWIPE_DISTANCE_THRESHOLD = 72;
const SWIPE_VELOCITY_THRESHOLD = 700;
const FAIL_OFFSET_Y = 16;
const ACTIVE_OFFSET_X = 12;
const EDGE_STRIP_WIDTH = 28;

export default function BusinessHomeScreen() {
  const router = useRouter();
  const { page: pageParam, tab: tabParam } = useLocalSearchParams<{
    page?: string;
    tab?: string;
  }>();
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
    discovery,
    locationRows,
    isPaidMember,
    membershipStatus,
    togglePaidMember,
    isLoading,
    isRefetching,
    refetchAll,
  } = useBusinessHomeData();

  const { page, push, pop, canPop } = useBusinessHomeNav(
    parseBusinessHomePage(pageParam),
  );
  const [activeSheet, setActiveSheet] = useState<BusinessHomeSheetId | null>(
    null,
  );

  const handleLocalBack = useCallback(() => {
    if (activeSheet) {
      setActiveSheet(null);
      return true;
    }
    if (canPop) {
      pop();
      return true;
    }
    return false;
  }, [activeSheet, canPop, pop]);

  useEffect(() => {
    if (!isBusinessAccountType(accountType ?? undefined)) {
      router.replace('/profile' as never);
    }
  }, [accountType, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () =>
      handleLocalBack(),
    );
    return () => sub.remove();
  }, [handleLocalBack]);

  const needsLocalSwipe = canPop || !!activeSheet;

  const handleEdgePanEnd = useCallback(
    (translationX: number, velocityX: number) => {
      const committed =
        translationX > SWIPE_DISTANCE_THRESHOLD ||
        velocityX > SWIPE_VELOCITY_THRESHOLD;
      if (committed) handleLocalBack();
    },
    [handleLocalBack],
  );

  const edgeBackPan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(needsLocalSwipe)
        .activeOffsetX(ACTIVE_OFFSET_X)
        .failOffsetX(-ACTIVE_OFFSET_X)
        .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
        .onEnd((event) => {
          'worklet';
          runOnJS(handleEdgePanEnd)(event.translationX, event.velocityX);
        }),
    [handleEdgePanEnd, needsLocalSwipe],
  );

  const openSheet = (id: BusinessHomeSheetId) => setActiveSheet(id);

  const handleRootBack = () => {
    if (handleLocalBack()) return;
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
        <Stack.Screen options={{ gestureEnabled: !needsLocalSwipe }} />
        <ActivityIndicator size="large" color="#FF6B1A" />
      </View>
    );
  }

  let content: ReactNode = null;

  switch (page) {
    case 'profile':
      content = (
        <BusinessHomeProfilePage
          initialTab={parseBusinessHomeTab(tabParam)}
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
          membershipStatus={membershipStatus}
          isRefetching={isRefetching}
          onRefresh={refetchAll}
          onBack={handleRootBack}
          onToggleMembership={togglePaidMember}
          onOpenSheet={openSheet}
          onOpenFullInsights={() => push('overview')}
          onOpenCampaign={() => push('campaign')}
          onOpenCustomers={() => push('customers')}
        />
      );
      break;
    case 'overview':
      content = (
        <BusinessHomeOverviewPage
          topline={topline}
          discovery={discovery}
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
          onOpenCampaign={() => push('campaign')}
          onOpenMembership={() => push('membership')}
          leadingLocationName={locationRows[0]?.name}
        />
      );
      break;
    case 'findyou':
      content = (
        <BusinessHomeFindYouPage
          onBack={pop}
          periodLabel={periodLabel}
          discovery={discovery}
          onOpenSpotlight={() => push('spotlight')}
        />
      );
      break;
    case 'locations':
      content = (
        <BusinessHomeLocationsPage
          locationRows={locationRows}
          isPaidMember={isPaidMember}
          onBack={pop}
          onOpenSheet={openSheet}
        />
      );
      break;
    case 'customers':
      content = (
        <BusinessHomeCustomersPage
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
      <Stack.Screen options={{ gestureEnabled: !needsLocalSwipe }} />
      {content}
      {isPaidMember && !activeSheet ? <AskCopilotFab /> : null}
      <BusinessHomeSheets
        activeSheet={activeSheet}
        isPaidMember={isPaidMember}
        onClose={() => setActiveSheet(null)}
      />
      {needsLocalSwipe ? (
        <GestureDetector gesture={edgeBackPan}>
          <View
            style={styles.leftStrip}
            collapsable={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </GestureDetector>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  leftStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: EDGE_STRIP_WIDTH,
    zIndex: 20,
  },
});
