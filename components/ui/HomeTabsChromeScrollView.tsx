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

interface HomeTabsChromeScrollViewProps extends ScrollViewProps {
  children: ReactNode;
}

export function HomeTabsChromeScrollView({
  scrollEventThrottle = 16,
  children,
  ...props
}: HomeTabsChromeScrollViewProps) {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const { scrollHandler } = useHomeTabsChrome();
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
        {children}
      </Animated.ScrollView>
      <ScrollToTopButton visible={visible} onPress={scrollToTop} />
    </View>
  );
}
