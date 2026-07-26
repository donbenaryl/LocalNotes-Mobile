import { useRef, type ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps } from 'react-native';
import { useHomeScrollChrome } from '@/hooks/useHomeScrollChrome';
import { useScrollToTopControl } from '@/hooks/useScrollToTopControl';
import { useHomeChromeStore } from '@/stores/useHomeChromeStore';
import { ScrollToTopButton } from '@/components/ui/ScrollToTopButton';

interface HomeChromeScrollViewProps extends ScrollViewProps {
  children: ReactNode;
}

export function HomeChromeScrollView({
  onScroll,
  scrollEventThrottle,
  contentContainerStyle,
  children,
  ...props
}: HomeChromeScrollViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const { onScroll: chromeOnScroll, scrollEventThrottle: chromeThrottle } =
    useHomeScrollChrome();
  const tabsHeight = useHomeChromeStore((s) => s.tabsHeight);
  const { visible, onScrollY, scrollToTop } = useScrollToTopControl(scrollRef);

  const handleScroll: ScrollViewProps['onScroll'] = (event) => {
    chromeOnScroll(event);
    onScrollY(event.nativeEvent.contentOffset.y);
    onScroll?.(event);
  };

  return (
    <View className="flex-1">
      <ScrollView
        ref={scrollRef}
        {...props}
        // Reserve constant space for the always-present Tabs overlay so the first
        // item sits just below it and the rest scrolls under the frosted bar,
        // without the layout ever shifting as the chrome collapses.
        contentContainerStyle={[{ paddingTop: tabsHeight }, contentContainerStyle]}
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle ?? chromeThrottle}
      >
        {children}
      </ScrollView>
      <ScrollToTopButton visible={visible} onPress={scrollToTop} />
    </View>
  );
}
