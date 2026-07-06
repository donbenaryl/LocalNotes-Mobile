import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { useHomeScrollChrome } from '@/hooks/useHomeScrollChrome';

interface HomeChromeScrollViewProps extends ScrollViewProps {
  children: ReactNode;
}

export function HomeChromeScrollView({
  onScroll,
  scrollEventThrottle,
  children,
  ...props
}: HomeChromeScrollViewProps) {
  const { onScroll: chromeOnScroll, scrollEventThrottle: chromeThrottle } =
    useHomeScrollChrome();

  const handleScroll: ScrollViewProps['onScroll'] = (event) => {
    chromeOnScroll(event);
    onScroll?.(event);
  };

  return (
    <ScrollView
      {...props}
      onScroll={handleScroll}
      scrollEventThrottle={scrollEventThrottle ?? chromeThrottle}
    >
      {children}
    </ScrollView>
  );
}
