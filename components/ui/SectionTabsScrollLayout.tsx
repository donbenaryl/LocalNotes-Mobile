import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import {
  SectionPager,
  type SectionPagerPage,
} from '@/components/ui/SectionPager';
import { GuardedHeader } from '@/components/ui/layout/GuardedHeader';
import { AppRefreshControl } from '@/components/ui/AppRefreshControl';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { useSectionPullToRefresh } from '@/components/ui/SectionPullToRefreshContext';
import { useContentBottomInset } from '@/hooks/useContentBottomInset';
import { useScrollToTopControl } from '@/hooks/useScrollToTopControl';
import type { SectionId } from '@/constants/swipeNavigation';

const STICKY_TIMING = {
  duration: 220,
  easing: Easing.ease,
};

interface SectionTabsScrollLayoutProps {
  sectionId: SectionId;
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  pages: SectionPagerPage[];
}

export function SectionTabsScrollLayout({
  sectionId,
  tabs,
  activeTab,
  onTabChange,
  pages,
}: SectionTabsScrollLayoutProps) {
  const scrollRef = useRef<ScrollView>(null);
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(scrollRef);
  const contentBottomInset = useContentBottomInset();
  const { handler } = useSectionPullToRefresh();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const [headerHeight, setHeaderHeight] = useState(0);
  const [tabsHeight, setTabsHeight] = useState(0);
  const stickyInteractiveRef = useRef(false);
  const [stickyPointerEvents, setStickyPointerEvents] = useState<
    'auto' | 'none'
  >('none');
  const stickyVisible = useSharedValue(0);
  const tabsHeightShared = useSharedValue(0);

  const stickyThreshold = headerHeight + tabsHeight;

  const setStickyInteractive = useCallback((interactive: boolean) => {
    if (stickyInteractiveRef.current === interactive) return;
    stickyInteractiveRef.current = interactive;
    setStickyPointerEvents(interactive ? 'auto' : 'none');
  }, []);

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    setHeaderHeight(event.nativeEvent.layout.height);
  }, []);

  const handleTabsLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      setTabsHeight(height);
      tabsHeightShared.value = height;
    },
    [tabsHeightShared],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      onScrollY(y);

      if (stickyThreshold <= 0) return;
      const nextVisible = y >= stickyThreshold ? 1 : 0;
      if (stickyVisible.value !== nextVisible) {
        stickyVisible.value = withTiming(nextVisible, STICKY_TIMING);
        setStickyInteractive(nextVisible === 1);
      }
    },
    [onScrollY, stickyThreshold, stickyVisible, setStickyInteractive],
  );

  const handleTabChange = useCallback(
    (tabId: string) => {
      onTabChange(tabId);
      stickyVisible.value = 0;
      setStickyInteractive(false);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      onScrollY(0);
    },
    [onScrollY, onTabChange, stickyVisible, setStickyInteractive],
  );

  useEffect(() => {
    stickyVisible.value = 0;
    setStickyInteractive(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    onScrollY(0);
  }, [activeTab, onScrollY, stickyVisible, setStickyInteractive]);

  const stickyStyle = useAnimatedStyle(() => {
    const height = tabsHeightShared.value;
    const hiddenOffset = height > 0 ? -height : -48;
    return {
      opacity: stickyVisible.value,
      transform: [
        {
          translateY: hiddenOffset * (1 - stickyVisible.value),
        },
      ],
    };
  });

  const handleRefresh = useCallback(() => {
    handlerRef.current?.onRefresh();
  }, []);

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <ScrollView
        ref={scrollRef}
        nestedScrollEnabled
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentBottomInset }}
        refreshControl={
          <AppRefreshControl
            refreshing={handler?.refreshing ?? false}
            onRefresh={handleRefresh}
          />
        }
      >
        <View className="px-4" onLayout={handleHeaderLayout}>
          <GuardedHeader />
        </View>
        <View className="px-4 pt-2 mb-4" onLayout={handleTabsLayout}>
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            className="border-b-0"
          />
        </View>
        <SectionPager
          embedded
          sectionId={sectionId}
          pages={pages}
          activeId={activeTab}
          onActiveIdChange={handleTabChange}
        />
      </ScrollView>

      <Animated.View
        style={stickyStyle}
        pointerEvents={stickyPointerEvents}
        className="absolute left-0 right-0 top-0 z-10 bg-page px-4 pb-2 pt-2 dark:bg-gray-900"
      >
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="border-b-0"
        />
      </Animated.View>

      <ScrollToTopButton visible={visible} onPress={scrollToTop} />
    </View>
  );
}
