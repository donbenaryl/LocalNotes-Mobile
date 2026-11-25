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
 * iOS: each tab owns its ScrollView inside a PagerView, so GuardedHeader +
 * Tabs are an overlay driven by the active page's scroll offset. The header
 * scrolls away with the feed and the tabs stay pinned (pages inset their
 * content by the chrome height).
 *
 * Android: KeyboardAwareScrollView as the section root (Smart Pick pattern)
 * with header + tabs + a content-sized active page inside. Plain ScrollView /
 * flex-fill feed chains paint blank on Android. A sticky Tabs overlay fades in
 * once the header has scrolled away. Swipes are a pan inside SectionPager that
 * wraps only the page body, so the chrome never moves.
 */
export function SectionTabsScrollLayout(props: SectionTabsScrollLayoutProps) {
  if (Platform.OS === 'android') {
    return <AndroidSectionTabsScrollLayout {...props} />;
  }
  return <IosSectionTabsScrollLayout {...props} />;
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
        className="bg-page/95 px-4 pt-2 dark:bg-dk-page/95"
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
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(scrollRef);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [tabsHeight, setTabsHeight] = useState(0);
  const scrollY = useSharedValue(0);
  const headerHeightSv = useSharedValue(0);

  const handleActiveScrollRef = useCallback((ref: ScrollToTopTarget | null) => {
    scrollRef.current = ref;
  }, []);

  const handleTabChange = useCallback(
    (tabId: string) => {
      onTabChange(tabId);
      onScrollY(0);
      scrollY.value = 0;
    },
    [onScrollY, onTabChange, scrollY],
  );

  const handleHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      headerHeightSv.value = height;
      setHeaderHeight((prev) => (prev === height ? prev : height));
    },
    [headerHeightSv],
  );

  const handleTabsLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setTabsHeight((prev) => (prev === height ? prev : height));
  }, []);

  // Header scrolls away with the feed; tabs end up flush at the top.
  // Overscroll (negative y) keeps the chrome in place.
  const chromeStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: -Math.min(Math.max(scrollY.value, 0), headerHeightSv.value),
      },
    ],
  }));

  const chromeHeight = headerHeight + tabsHeight;

  return (
    <View className="bg-page dark:bg-dk-page" style={styles.column}>
      <View style={styles.pagerHost} collapsable={false}>
        <SectionPager
          scrollable
          sectionId={sectionId}
          pages={pages}
          activeId={activeTab}
          onActiveIdChange={handleTabChange}
          onActiveScrollRef={handleActiveScrollRef}
          onScrollY={onScrollY}
          contentInsetTop={chromeHeight}
          scrollY={scrollY}
        />
      </View>
      <Animated.View style={[styles.iosChrome, chromeStyle]} pointerEvents="box-none">
        <View
          className="bg-page px-4 dark:bg-dk-page"
          onLayout={handleHeaderLayout}
        >
          <GuardedHeader />
        </View>
        <View
          className="bg-page px-4 pb-4 pt-2 dark:bg-dk-page"
          onLayout={handleTabsLayout}
        >
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            className="border-b-0"
          />
        </View>
      </Animated.View>
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
    <View className="bg-page dark:bg-dk-page" style={styles.column}>
      <KeyboardAwareScrollView
        ref={scrollRef}
        className="flex-1 bg-page dark:bg-dk-page"
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
  /** iOS collapsing chrome: overlays the pager; pages inset their content below it. */
  iosChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
