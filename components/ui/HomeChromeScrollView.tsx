import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { useHomeScrollChrome } from '@/hooks/useHomeScrollChrome';
import { useHomeChromeStore } from '@/stores/useHomeChromeStore';

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
  const { onScroll: chromeOnScroll, scrollEventThrottle: chromeThrottle } =
    useHomeScrollChrome();
  const tabsHeight = useHomeChromeStore((s) => s.tabsHeight);

  const handleScroll: ScrollViewProps['onScroll'] = (event) => {
    chromeOnScroll(event);
    onScroll?.(event);
  };

  return (
    <ScrollView
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
  );
}
