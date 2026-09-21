import { useCallback, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import {
  SectionPager,
  type SectionPagerPage,
} from '@/components/ui/SectionPager';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { GuardedHeader } from '@/components/ui/layout/GuardedHeader';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { useSectionPullToRefresh } from '@/components/ui/SectionPullToRefreshContext';
import {
  useScrollToTopControl,
  type ScrollToTopTarget,
} from '@/hooks/useScrollToTopControl';
import { useContentBottomInset } from '@/hooks/useContentBottomInset';
import type { SectionId } from '@/constants/swipeNavigation';

/** Matches ProfileVitalBar / CSS transition: opacity/transform .22s ease */
const REVEAL_DURATION_MS = 220;
const REVEAL_TIMING = {
  duration: REVEAL_DURATION_MS,
  easing: Easing.ease,
};
/** Reveal when header is almost off-screen (8px remaining). */
const REVEAL_SLACK_PX = 8;
/** Hide hysteresis band — same 32px gap as profile chrome (300/260). */
const HIDE_SLACK_PX = 40;

interface SectionTabsScrollLayoutProps {
  sectionId: SectionId;
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  pages: SectionPagerPage[];
}

/**
 * Android: KeyboardAwareScrollView as the section root (Smart Pick pattern) with
 * header + tabs + feed inside. Plain ScrollView / chrome-outside-flex bands paint
 * blank on Android. iOS puts chrome inside each page ScrollView via scrollHeader.
 *
 * Both platforms reveal a sticky Tabs overlay once GuardedHeader is almost hidden,
 * using the same timed fade/slide as ProfileVitalBar.
 */
export function SectionTabsScrollLayout({
  sectionId,
  tabs,
  activeTab,
  onTabChange,
  pages,
}: SectionTabsScrollLayoutProps) {
  if (Platform.OS === 'android') {
    return (
      <AndroidSectionTabsScrollLayout
        sectionId={sectionId}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        pages={pages}
      />
    );
  }

  return (
    <IosSectionTabsScrollLayout
      sectionId={sectionId}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      pages={pages}
    />
  );
}

/**
 * Binary timed reveal driven by header height (measured via onLayout).
 * Show when scrollY > headerHeight - 8; hide when scrollY < headerHeight - 40.
 */
function useStickyTabsReveal(headerHeight: number) {
  const hideProgress = useSharedValue(0);
  const hideProgressTarget = useSharedValue(0);
  const headerHeightRef = useRef(headerHeight);
  headerHeightRef.current = headerHeight;

  const updateFromScrollY = useCallback(
    (y: number) => {
      const height = headerHeightRef.current;
      if (height <= 0) return;

      const revealAt = height - REVEAL_SLACK_PX;
      const hideAt = height - HIDE_SLACK_PX;
      let nextTarget = hideProgressTarget.value;

      if (y > revealAt) {
        nextTarget = 1;
      } else if (y < hideAt) {
        nextTarget = 0;
      }

      if (hideProgressTarget.value !== nextTarget) {
        hideProgressTarget.value = nextTarget;
        hideProgress.value = withTiming(nextTarget, REVEAL_TIMING);
      }
    },
    [hideProgress, hideProgressTarget],
  );

  const resetReveal = useCallback(() => {
    hideProgress.value = 0;
    hideProgressTarget.value = 0;
  }, [hideProgress, hideProgressTarget]);

  return { hideProgress, updateFromScrollY, resetReveal };
}

function SectionInFlowChrome({
  tabs,
  activeTab,
  onTabChange,
  onHeaderHeight,
}: {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onHeaderHeight: (height: number) => void;
}) {
  const handleHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onHeaderHeight(event.nativeEvent.layout.height);
    },
    [onHeaderHeight],
  );

  return (
    <>
      <View className="px-4" onLayout={handleHeaderLayout}>
        <GuardedHeader />
      </View>
      <View className="px-4 pt-2 mb-4">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          className="border-b-0"
        />
      </View>
    </>
  );
}

function StickySectionTabs({
  tabs,
  activeTab,
  onTabChange,
  hideProgress,
}: {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  hideProgress: SharedValue<number>;
}) {
  const [interactive, setInteractive] = useState(false);

  useAnimatedReaction(
    () => hideProgress.value > 0.01,
    (visible, prev) => {
      if (visible === prev) return;
      runOnJS(setInteractive)(visible);
    },
    [hideProgress],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: hideProgress.value,
    transform: [
      { translateY: interpolate(hideProgress.value, [0, 1], [-8, 0]) },
    ],
  }));

  return (
    <View
      style={styles.stickyHost}
      pointerEvents={interactive ? 'auto' : 'none'}
      accessibilityElementsHidden={!interactive}
      importantForAccessibility={interactive ? 'yes' : 'no-hide-descendants'}
    >
      <Animated.View
        style={animatedStyle}
        className="bg-page/95 px-4 pt-2 dark:bg-gray-900/95"
      >
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          className="border-b-0"
        />
      </Animated.View>
    </View>
  );
}

function IosSectionTabsScrollLayout({
  sectionId,
  tabs,
  activeTab,
  onTabChange,
  pages,
}: SectionTabsScrollLayoutProps) {
  const scrollRef = useRef<ScrollToTopTarget | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(scrollRef);
  const { hideProgress, updateFromScrollY, resetReveal } =
    useStickyTabsReveal(headerHeight);

  const handleActiveScrollRef = useCallback((ref: ScrollToTopTarget | null) => {
    scrollRef.current = ref;
  }, []);

  const handleScrollY = useCallback(
    (y: number) => {
      onScrollY(y);
      updateFromScrollY(y);
    },
    [onScrollY, updateFromScrollY],
  );

  const handleTabChange = useCallback(
    (tabId: string) => {
      onTabChange(tabId);
      onScrollY(0);
      resetReveal();
    },
    [onScrollY, onTabChange, resetReveal],
  );

  const handleHeaderHeight = useCallback((height: number) => {
    setHeaderHeight((prev) => (prev === height ? prev : height));
  }, []);

  const renderScrollHeader = useCallback(
    () => (
      <SectionInFlowChrome
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onHeaderHeight={handleHeaderHeight}
      />
    ),
    [activeTab, handleHeaderHeight, handleTabChange, tabs],
  );

  return (
    <View className="bg-page dark:bg-gray-900" style={styles.column}>
      <View style={styles.pagerHost} collapsable={false}>
        <SectionPager
          scrollable
          sectionId={sectionId}
          pages={pages}
          activeId={activeTab}
          onActiveIdChange={handleTabChange}
          onActiveScrollRef={handleActiveScrollRef}
          onScrollY={handleScrollY}
          scrollHeader={renderScrollHeader}
        />
      </View>
      <StickySectionTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hideProgress={hideProgress}
      />
      <ScrollToTopButton visible={visible} onPress={scrollToTop} />
    </View>
  );
}

function AndroidSectionTabsScrollLayout({
  sectionId,
  tabs,
  activeTab,
  onTabChange,
  pages,
}: SectionTabsScrollLayoutProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const contentBottomInset = useContentBottomInset();
  const { infiniteScrollHandler } = useSectionPullToRefresh();
  const infiniteScrollHandlerRef = useRef(infiniteScrollHandler);
  infiniteScrollHandlerRef.current = infiniteScrollHandler;
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(scrollRef);
  const { hideProgress, updateFromScrollY, resetReveal } =
    useStickyTabsReveal(headerHeight);

  const handleTabChange = useCallback(
    (tabId: string) => {
      onTabChange(tabId);
      onScrollY(0);
      resetReveal();
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
    [onScrollY, onTabChange, resetReveal],
  );

  const handleHeaderHeight = useCallback((height: number) => {
    setHeaderHeight((prev) => (prev === height ? prev : height));
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } =
        event.nativeEvent;
      const y = contentOffset.y;
      onScrollY(y);
      updateFromScrollY(y);

      const infiniteScroll = infiniteScrollHandlerRef.current;
      if (infiniteScroll?.hasNextPage && !infiniteScroll.isFetchingNextPage) {
        const distanceFromBottom =
          contentSize.height - layoutMeasurement.height - y;
        if (distanceFromBottom < 240) {
          infiniteScroll.onLoadMore();
        }
      }
    },
    [onScrollY, updateFromScrollY],
  );

  return (
    <View className="bg-page dark:bg-gray-900" style={styles.column}>
      <KeyboardAwareScrollView
        ref={scrollRef}
        className="flex-1 bg-page dark:bg-gray-900"
        enabled={false}
        contentContainerStyle={{ paddingBottom: contentBottomInset }}
        nestedScrollEnabled
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <SectionInFlowChrome
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onHeaderHeight={handleHeaderHeight}
        />
        <SectionPager
          sectionId={sectionId}
          pages={pages}
          activeId={activeTab}
          onActiveIdChange={handleTabChange}
        />
      </KeyboardAwareScrollView>
      <StickySectionTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hideProgress={hideProgress}
      />
      <ScrollToTopButton visible={visible} onPress={scrollToTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    minHeight: 0,
  },
  pagerHost: {
    flex: 1,
    minHeight: 0,
  },
  /** Top-anchored only — must not fill the screen or it steals feed touches. */
  stickyHost: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
