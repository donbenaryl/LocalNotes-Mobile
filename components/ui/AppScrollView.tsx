import { useRef, type ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useScrollToTopControl } from '@/hooks/useScrollToTopControl';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';

interface AppScrollViewProps extends ScrollViewProps {
  children?: ReactNode;
}

/** Vertical page ScrollView with scroll-to-top FAB. Do not use for horizontal carousels. */
export function AppScrollView({
  onScroll,
  scrollEventThrottle,
  children,
  ...props
}: AppScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(scrollRef);

  const handleScroll: ScrollViewProps['onScroll'] = (event) => {
    onScrollY(event.nativeEvent.contentOffset.y);
    onScroll?.(event);
  };

  return (
    <View className="flex-1">
      <ScrollView
        ref={scrollRef}
        {...props}
        scrollEventThrottle={scrollEventThrottle ?? 16}
        onScroll={handleScroll}
      >
        {children}
      </ScrollView>
      <ScrollToTopButton visible={visible} onPress={scrollToTop} />
    </View>
  );
}
