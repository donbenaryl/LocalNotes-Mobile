import { useEffect, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const ANIMATION_DURATION = 220;

interface CollapsibleChromeBaseProps {
  children: ReactNode;
}

type CollapsibleChromeProps =
  | (CollapsibleChromeBaseProps & { isHidden: boolean; hideProgress?: never })
  | (CollapsibleChromeBaseProps & { hideProgress: SharedValue<number>; isHidden?: never });

export function CollapsibleChrome({
  children,
  isHidden,
  hideProgress,
}: CollapsibleChromeProps) {
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const timedProgress = useSharedValue(0);
  const isScrollLinked = hideProgress !== undefined;

  useEffect(() => {
    if (isScrollLinked) return;
    timedProgress.value = withTiming(isHidden ? 1 : 0, { duration: ANIMATION_DURATION });
  }, [isHidden, isScrollLinked, timedProgress]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height <= 0) return;

    if (isScrollLinked) {
      // Capture the natural height while fully expanded so content swaps
      // (e.g. skeleton -> loaded ProfileInfo) or growth are picked up instead
      // of staying clamped to a stale, smaller height.
      if (measuredHeight === 0 || hideProgress.value === 0) {
        setMeasuredHeight((prev) => (Math.abs(prev - height) < 0.5 ? prev : height));
      }
      return;
    }

    // Only capture the natural height while expanded. Measuring during the
    // collapsed state can report a clamped value and poison the height.
    if (!isHidden) {
      setMeasuredHeight((prev) => (Math.abs(prev - height) < 0.5 ? prev : height));
    }
  };

  const isMeasured = measuredHeight > 0;

  const animatedStyle = useAnimatedStyle(() => {
    if (!isMeasured) {
      return { overflow: 'hidden' as const };
    }

    const progress = isScrollLinked ? hideProgress.value : timedProgress.value;

    return {
      height: measuredHeight * (1 - progress),
      opacity: 1 - progress,
      overflow: 'hidden' as const,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <View
        onLayout={handleLayout}
        // Once measured, take the child out of flow so the animating parent
        // height never constrains or re-measures its intrinsic height.
        style={
          isMeasured
            ? { position: 'absolute', left: 0, right: 0, top: 0 }
            : undefined
        }
      >
        {children}
      </View>
    </Animated.View>
  );
}
