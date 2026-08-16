import { useEffect, useRef, type ReactNode } from 'react';
import { View, type ScrollViewProps } from 'react-native';
import Animated from 'react-native-reanimated';
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
  const { scrollHandler, setScrollYListener } = useProfileChrome();
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(scrollRef);

  useEffect(() => {
    setScrollYListener(onScrollY);
    return () => setScrollYListener(null);
  }, [onScrollY, setScrollYListener]);

  return (
    <View className="flex-1">
      <Animated.ScrollView
        ref={scrollRef}
        {...props}
        onScroll={scrollHandler}
        scrollEventThrottle={scrollEventThrottle}
      >
        {children}
      </Animated.ScrollView>
      <ScrollToTopButton visible={visible} onPress={scrollToTop} />
    </View>
  );
}
