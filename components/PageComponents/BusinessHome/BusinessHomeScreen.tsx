import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { isBusinessAccountType } from '@/utils/businessAccount';
import { useBusinessHomeData } from '@/hooks/useBusinessHomeData';
import {
  useBusinessHomeNav,
  type BusinessHomePageId,
} from './navigation';
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
const POP_DURATION_MS = 250;
const UNDERLAY_PARALLAX = 0.3;
const SPRING_CONFIG = {
  damping: 28,
  stiffness: 280,
  mass: 0.8,
} as const;

export default function BusinessHomeScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
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

  const { page, stack, push, pop, canPop } = useBusinessHomeNav(
    parseBusinessHomePage(pageParam),
  );
  const [activeSheet, setActiveSheet] = useState<BusinessHomeSheetId | null>(
    null,
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pendingTranslateResetRef = useRef(false);

  const translateX = useSharedValue(0);
  const screenWidthSV = useSharedValue(screenWidth);
  const sheetOpenSV = useSharedValue(0);

  useEffect(() => {
    screenWidthSV.value = screenWidth;
  }, [screenWidth, screenWidthSV]);

  useEffect(() => {
    sheetOpenSV.value = activeSheet ? 1 : 0;
  }, [activeSheet, sheetOpenSV]);

  // Reset translateX only after the stack page has updated, before paint —
  // resetting in finishPop flashes the dismissed page for a frame.
  useLayoutEffect(() => {
    if (!pendingTranslateResetRef.current) return;
    pendingTranslateResetRef.current = false;
    translateX.value = 0;
    setIsTransitioning(false);
  }, [page, translateX]);

  const finishPop = useCallback(() => {
    pendingTranslateResetRef.current = true;
    pop();
  }, [pop]);

  const animatePop = useCallback(() => {
    if (isTransitioning || !canPop) return;
    setIsTransitioning(true);
    translateX.value = withTiming(
      screenWidthSV.value,
      { duration: POP_DURATION_MS },
      (finished) => {
        if (finished) runOnJS(finishPop)();
        else runOnJS(setIsTransitioning)(false);
      },
    );
  }, [
    canPop,
    finishPop,
    isTransitioning,
    screenWidthSV,
    translateX,
  ]);

  const handleLocalBack = useCallback(() => {
    if (activeSheet) {
      setActiveSheet(null);
      return true;
    }
    if (canPop) {
      animatePop();
      return true;
    }
    return false;
  }, [activeSheet, animatePop, canPop]);

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
  const edgeGestureEnabled =
    needsLocalSwipe && !isTransitioning;

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const cancelTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  const closeSheet = useCallback(() => {
    setActiveSheet(null);
  }, []);

  const edgeBackPan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(edgeGestureEnabled)
        .activeOffsetX(ACTIVE_OFFSET_X)
        .failOffsetX(-ACTIVE_OFFSET_X)
        .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
        .onUpdate((event) => {
          'worklet';
          if (sheetOpenSV.value) return;
          translateX.value = Math.max(0, event.translationX);
        })
        .onEnd((event) => {
          'worklet';
          if (sheetOpenSV.value) {
            const committed =
              event.translationX > SWIPE_DISTANCE_THRESHOLD ||
              event.velocityX > SWIPE_VELOCITY_THRESHOLD;
            if (committed) runOnJS(closeSheet)();
            return;
          }

          const committed =
            event.translationX > SWIPE_DISTANCE_THRESHOLD ||
            event.velocityX > SWIPE_VELOCITY_THRESHOLD ||
            event.translationX > screenWidthSV.value * 0.35;

          if (committed) {
            runOnJS(startTransition)();
            translateX.value = withTiming(
              screenWidthSV.value,
              { duration: POP_DURATION_MS },
              (finished) => {
                if (finished) runOnJS(finishPop)();
                else runOnJS(cancelTransition)();
              },
            );
          } else {
            translateX.value = withSpring(0, SPRING_CONFIG);
          }
        }),
    [
      cancelTransition,
      closeSheet,
      edgeGestureEnabled,
      finishPop,
      screenWidthSV,
      sheetOpenSV,
      startTransition,
      translateX,
    ],
  );

  const foregroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: translateX.value > 0 ? 0.18 : 0,
    shadowRadius: 8,
    elevation: translateX.value > 0 ? 8 : 0,
    zIndex: 1,
  }));

  const underlayStyle = useAnimatedStyle(() => {
    const width = screenWidthSV.value || 1;
    const progress = Math.min(1, Math.max(0, translateX.value / width));
    return {
      transform: [
        { translateX: -width * UNDERLAY_PARALLAX * (1 - progress) },
      ],
    };
  });

  const openSheet = useCallback((id: BusinessHomeSheetId) => {
    setActiveSheet(id);
  }, []);

  const handleRootBack = useCallback(() => {
    if (handleLocalBack()) return;
    router.back();
  }, [handleLocalBack, router]);

  const handleNestedBack = useCallback(() => {
    if (activeSheet) {
      setActiveSheet(null);
      return;
    }
    animatePop();
  }, [activeSheet, animatePop]);

  const renderPage = useCallback(
    (id: BusinessHomePageId): ReactNode => {
      switch (id) {
        case 'profile':
          return (
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
        case 'overview':
          return (
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
              onBack={handleNestedBack}
              onOpenSheet={openSheet}
              onOpenFindYou={() => push('findyou')}
              onOpenLocations={() => push('locations')}
              onOpenCustomers={() => push('customers')}
              onOpenCampaign={() => push('campaign')}
              onOpenMembership={() => push('membership')}
              leadingLocationName={locationRows[0]?.name}
            />
          );
        case 'findyou':
          return (
            <BusinessHomeFindYouPage
              onBack={handleNestedBack}
              periodLabel={periodLabel}
              discovery={discovery}
              onOpenSpotlight={() => push('spotlight')}
            />
          );
        case 'locations':
          return (
            <BusinessHomeLocationsPage
              locationRows={locationRows}
              isPaidMember={isPaidMember}
              onBack={handleNestedBack}
              onOpenSheet={openSheet}
            />
          );
        case 'customers':
          return (
            <BusinessHomeCustomersPage
              isPaidMember={isPaidMember}
              onBack={handleNestedBack}
            />
          );
        case 'membership':
          return (
            <BusinessHomeMembershipPage
              isPaidMember={isPaidMember}
              onBack={handleNestedBack}
            />
          );
        case 'campaign':
          return (
            <BusinessHomeCampaignPage
              isPaidMember={isPaidMember}
              onBack={handleNestedBack}
              onOpenSheet={openSheet}
            />
          );
        case 'spotlight':
          return <BusinessHomeSpotlightPage onBack={handleNestedBack} />;
        default:
          return null;
      }
    },
    [
      businessLogo,
      businessName,
      dateFrom,
      dateTo,
      discovery,
      handleNestedBack,
      handleRootBack,
      isPaidMember,
      isRefetching,
      locationName,
      locationRows,
      managerName,
      membershipStatus,
      onDateRangeChange,
      openSheet,
      periodLabel,
      push,
      refetchAll,
      roleLabel,
      tabParam,
      togglePaidMember,
      topline,
    ],
  );

  if (!isBusinessAccountType(accountType ?? undefined)) {
    return null;
  }

  if (isLoading) {
    return (
      <View
        style={styles.root}
        className="items-center justify-center bg-page dark:bg-dk-page"
      >
        <Stack.Screen options={{ gestureEnabled: !needsLocalSwipe }} />
        <ActivityIndicator size="large" color="#1A1714" />
      </View>
    );
  }

  const underlayPageId =
    canPop && stack.length >= 2 ? stack[stack.length - 2] : null;

  return (
    <View style={styles.root} className="bg-page dark:bg-dk-page">
      <Stack.Screen options={{ gestureEnabled: !needsLocalSwipe }} />

      {underlayPageId ? (
        <Animated.View
          style={[styles.layer, underlayStyle]}
          className="bg-page dark:bg-dk-page"
          pointerEvents="none"
        >
          {renderPage(underlayPageId)}
        </Animated.View>
      ) : null}

      <Animated.View
        style={[styles.layer, foregroundStyle]}
        className="bg-page dark:bg-dk-page"
      >
        {renderPage(page)}
      </Animated.View>

      {isPaidMember && !activeSheet ? <AskCopilotFab /> : null}
      <BusinessHomeSheets
        activeSheet={activeSheet}
        isPaidMember={isPaidMember}
        onClose={() => setActiveSheet(null)}
      />
      {edgeGestureEnabled ? (
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
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  leftStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: EDGE_STRIP_WIDTH,
    zIndex: 20,
  },
});
