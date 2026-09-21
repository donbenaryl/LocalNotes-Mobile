import { useRef, type ReactNode } from "react";
import { View, type LayoutChangeEvent, type ScrollViewProps } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { cn } from "@/utils/cn";

const MIN_THUMB_HEIGHT = 24;
const BRAND_ORANGE = "#FF6B1A";

function computeThumbMetrics(contentH: number, layoutH: number) {
  "worklet";
  const overflow = contentH - layoutH;
  if (overflow <= 1 || layoutH <= 0 || contentH <= 0) {
    return {
      opacity: 0,
      maxScroll: 1,
      travel: 0,
      height: MIN_THUMB_HEIGHT,
    };
  }
  const height = Math.max(
    MIN_THUMB_HEIGHT,
    (layoutH / contentH) * layoutH,
  );
  return {
    opacity: 1,
    maxScroll: overflow,
    travel: Math.max(layoutH - height, 0),
    height,
  };
}

interface ScrollableContainerProps extends Omit<
  ScrollViewProps,
  "showsVerticalScrollIndicator" | "onScroll" | "scrollEventThrottle"
> {
  children?: ReactNode;
  /** NativeWind / Tailwind classes for the host + scroll viewport (e.g. `max-h-48`). */
  className?: string;
  /** Extra NativeWind classes for the ScrollView only. */
  contentClassName?: string;
  /** Scrollbar thumb color. Defaults to brand orange. */
  indicatorColor?: string;
}

/**
 * Nested-friendly ScrollView with a brand scrollbar thumb.
 * Size is measured only when content or layout changes. Scroll updates
 * translateY on the UI thread so the thumb stays locked to the offset.
 */
export function ScrollableContainer({
  children,
  className,
  contentClassName,
  indicatorColor = BRAND_ORANGE,
  nestedScrollEnabled = true,
  onContentSizeChange,
  onLayout,
  ...props
}: ScrollableContainerProps) {
  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const layoutHeight = useSharedValue(0);
  const maxScroll = useSharedValue(1);
  const thumbHeight = useSharedValue(MIN_THUMB_HEIGHT);
  const thumbTravel = useSharedValue(0);
  const thumbOpacity = useSharedValue(0);
  // JS copies. Never read shared values back on the JS thread — those reads
  // stay stale and were zeroing the viewport height, which hid the thumb.
  const contentHeightRef = useRef(0);
  const layoutHeightRef = useRef(0);

  const publishMetrics = (contentH: number, layoutH: number) => {
    const metrics = computeThumbMetrics(contentH, layoutH);
    contentHeight.value = contentH;
    layoutHeight.value = layoutH;
    thumbOpacity.value = metrics.opacity;
    maxScroll.value = metrics.maxScroll;
    thumbTravel.value = metrics.travel;
    thumbHeight.value = metrics.height;
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const contentH = event.contentSize.height;
      const layoutH = event.layoutMeasurement.height;
      if (contentH === contentHeight.value && layoutH === layoutHeight.value) {
        return;
      }
      const metrics = computeThumbMetrics(contentH, layoutH);
      contentHeight.value = contentH;
      layoutHeight.value = layoutH;
      thumbOpacity.value = metrics.opacity;
      maxScroll.value = metrics.maxScroll;
      thumbTravel.value = metrics.travel;
      thumbHeight.value = metrics.height;
    },
  });

  // Size/opacity only. Must not read scrollY, or height relayouts every frame.
  const thumbSizeStyle = useAnimatedStyle(() => ({
    height: thumbHeight.value,
    opacity: thumbOpacity.value,
  }));

  const thumbMotionStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, maxScroll.value],
          [0, thumbTravel.value],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const handleHostLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h === layoutHeightRef.current) return;
    layoutHeightRef.current = h;
    publishMetrics(contentHeightRef.current, h);
  };

  const handleContentSizeChange = (w: number, h: number) => {
    if (h !== contentHeightRef.current) {
      contentHeightRef.current = h;
      publishMetrics(h, layoutHeightRef.current);
    }
    onContentSizeChange?.(w, h);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    onLayout?.(e);
  };

  return (
    <View
      className={cn("relative overflow-hidden", className)}
      onLayout={handleHostLayout}
    >
      <Animated.ScrollView
        {...props}
        nestedScrollEnabled={nestedScrollEnabled}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={1}
        onScroll={scrollHandler}
        className={cn(className, contentClassName)}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
      >
        {children}
      </Animated.ScrollView>

      <View
        pointerEvents="none"
        className="absolute bottom-1 right-0 top-1 w-1"
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              right: 0,
              width: 4,
              borderRadius: 999,
              backgroundColor: indicatorColor,
            },
            thumbSizeStyle,
            thumbMotionStyle,
          ]}
        />
      </View>
    </View>
  );
}
