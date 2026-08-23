import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import {
  SectionPager,
  type SectionPagerPage,
} from '@/components/ui/SectionPager';
import { GuardedHeader } from '@/components/ui/layout/GuardedHeader';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import {
  useScrollToTopControl,
  type ScrollToTopTarget,
} from '@/hooks/useScrollToTopControl';
import type { SectionId } from '@/constants/swipeNavigation';

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
    <View className="flex-1 bg-page dark:bg-gray-900">
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
        scrollable
        sectionId={sectionId}
        pages={pages}
        activeId={activeTab}
        onActiveIdChange={handleTabChange}
        onActiveScrollRef={handleActiveScrollRef}
        onScrollY={onScrollY}
      />
      <ScrollToTopButton visible={visible} onPress={scrollToTop} />
    </View>
  );
}
