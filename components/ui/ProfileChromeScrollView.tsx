import type { ReactNode } from 'react';
import type { ScrollViewProps } from 'react-native';
import Animated from 'react-native-reanimated';
import { useProfileChrome } from '@/components/PageComponents/Profile/ProfileChromeProvider';

interface ProfileChromeScrollViewProps extends ScrollViewProps {
  children: ReactNode;
}

export function ProfileChromeScrollView({
  scrollEventThrottle = 16,
  children,
  ...props
}: ProfileChromeScrollViewProps) {
  const { scrollHandler } = useProfileChrome();

  return (
    <Animated.ScrollView
      {...props}
      onScroll={scrollHandler}
      scrollEventThrottle={scrollEventThrottle}
    >
      {children}
    </Animated.ScrollView>
  );
}
