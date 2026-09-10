import { useCallback, useRef } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
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
 * blank on Android. iOS keeps chrome outside + scrollable SectionPager.
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

function IosSectionTabsScrollLayout({
  sectionId,
  tabs,
  activeTab,
  onTabChange,
  pages,
}: SectionTabsScrollLayoutProps) {
  const scrollRef = useRef<ScrollToTopTarget | null>(null);
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(scrollRef);

  const handleActiveScrollRef = useCallback((ref: ScrollToTopTarget | null) => {
    scrollRef.current = ref;
  }, []);

  const handleTabChange = useCallback(
    (tabId: string) => {
      onTabChange(tabId);
      onScrollY(0);
    },
    [onScrollY, onTabChange],
  );

  return (
    <View className="bg-page dark:bg-gray-900" style={styles.column}>
      <View className="px-4">
        <GuardedHeader />
      </View>
      <View className="px-4 pt-2 mb-4">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="border-b-0"
        />
      </View>
      <View style={styles.pagerHost} collapsable={false}>
        <SectionPager
          scrollable
          sectionId={sectionId}
          pages={pages}
          activeId={activeTab}
          onActiveIdChange={handleTabChange}
          onActiveScrollRef={handleActiveScrollRef}
          onScrollY={onScrollY}
        />
      </View>
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
  const contentBottomInset = useContentBottomInset();
  const { infiniteScrollHandler } = useSectionPullToRefresh();
  const infiniteScrollHandlerRef = useRef(infiniteScrollHandler);
  infiniteScrollHandlerRef.current = infiniteScrollHandler;
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(scrollRef);

  const handleTabChange = useCallback(
    (tabId: string) => {
      onTabChange(tabId);
      onScrollY(0);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    },
    [onScrollY, onTabChange],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } =
        event.nativeEvent;
      const y = contentOffset.y;
      onScrollY(y);

      const infiniteScroll = infiniteScrollHandlerRef.current;
      if (infiniteScroll?.hasNextPage && !infiniteScroll.isFetchingNextPage) {
        const distanceFromBottom =
          contentSize.height - layoutMeasurement.height - y;
        if (distanceFromBottom < 240) {
          infiniteScroll.onLoadMore();
        }
      }
    },
    [onScrollY],
  );

  return (
    <>
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
        <View className="px-4">
          <GuardedHeader />
        </View>
        <View className="px-4 pt-2 mb-4">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            className="border-b-0"
          />
        </View>
        <SectionPager
          sectionId={sectionId}
          pages={pages}
          activeId={activeTab}
          onActiveIdChange={handleTabChange}
        />
      </KeyboardAwareScrollView>
      <ScrollToTopButton visible={visible} onPress={scrollToTop} />
    </>
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
});
