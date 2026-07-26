import { useRef, type ReactNode } from 'react';
import { View, type ScrollViewProps } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useComposedEventHandler,
} from 'react-native-reanimated';
import { useProfileChrome } from '@/components/PageComponents/Profile/ProfileChromeProvider';
import { useScrollToTopControl } from '@/hooks/useScrollToTopControl';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';

interface ProfileChromeScrollViewProps extends ScrollViewProps {
  children: ReactNode;
}

export function ProfileChromeScrollView({
  scrollEventThrottle = 16,
  children,
  ...props
}: ProfileChromeScrollViewProps) {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const { scrollHandler } = useProfileChrome();
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
