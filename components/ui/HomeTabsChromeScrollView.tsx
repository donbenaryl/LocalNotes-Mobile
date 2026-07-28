import { useRef, type ReactNode } from 'react';
import { View, type ScrollViewProps } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useComposedEventHandler,
} from 'react-native-reanimated';
import { useHomeTabsChrome } from '@/components/ui/HomeTabsChromeProvider';
import { useScrollToTopControl } from '@/hooks/useScrollToTopControl';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';
import { Tabs } from '@/components/ui/Tabs';
import { GuardedHeader } from '@/components/ui/layout/GuardedHeader';

interface HomeTabsChromeScrollViewProps extends ScrollViewProps {
  children: ReactNode;
}

export function HomeTabsChromeScrollView({
  scrollEventThrottle = 16,
  children,
  ...props
}: HomeTabsChromeScrollViewProps) {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const { scrollHandler, tabs, activeTab, onTabChange } = useHomeTabsChrome();
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(scrollRef);

  const fabScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      runOnJS(onScrollY)(event.contentOffset.y);
    },
  });

  const composedScrollHandler = useComposedEventHandler([
    scrollHandler,
    fabScrollHandler,
  ]);

  return (
    <View className="flex-1">
      <Animated.ScrollView
        ref={scrollRef}
        {...props}
        onScroll={composedScrollHandler}
        scrollEventThrottle={scrollEventThrottle}
      >
        <GuardedHeader />
        <View className="pt-2 mb-4">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            className="border-b-0"
          />
        </View>
        {children}
      </Animated.ScrollView>
      <ScrollToTopButton visible={visible} onPress={scrollToTop} />
    </View>
  );
}
