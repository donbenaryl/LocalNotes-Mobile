import { useCallback, useRef, useState } from "react";
import { Animated, View } from "react-native";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { ScreenRect } from "@/types/layout";

/** Fallback travel when the source rect is unknown — a plain rise from below. */
const FALLBACK_TRANSLATE_Y = 120;
const FALLBACK_SCALE = 0.94;

interface MorphFromOriginViewProps {
  /** 0 = sitting on the origin rect, 1 = resting in its own laid-out slot. */
  progress: Animated.Value;
  /** Screen rect of the element this view appears to come from. */
  originRect?: ScreenRect | null;
  children: ReactNode;
  /** Visuals for the animated card — they scale with it during the flight. */
  className?: string;
  /** Layout for the measured wrapper, which defines the resting rect. */
  containerClassName?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function MorphFromOriginView({
  progress,
  originRect,
  children,
  className,
  containerClassName,
  containerStyle,
}: MorphFromOriginViewProps) {
  const viewRef = useRef<View>(null);
  const [targetRect, setTargetRect] = useState<ScreenRect | null>(null);

  const handleLayout = useCallback(() => {
    viewRef.current?.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) return;
      setTargetRect((previous) =>
        previous &&
        previous.x === x &&
        previous.y === y &&
        previous.width === width &&
        previous.height === height
          ? previous
          : { x, y, width, height },
      );
    });
  }, []);

  // Align the top-left corners at progress 0 (not the centres) so the hero
  // images of the source and this card overlap where the eye tracks. Scaling
  // happens about the centre, hence the half-size correction terms.
  const canMorph = originRect != null && targetRect != null && targetRect.width > 0;
  const scale = canMorph ? originRect.width / targetRect.width : FALLBACK_SCALE;
  const translateX = canMorph
    ? originRect.x - targetRect.x + (targetRect.width / 2) * (scale - 1)
    : 0;
  const translateY = canMorph
    ? originRect.y - targetRect.y + (targetRect.height / 2) * (scale - 1)
    : FALLBACK_TRANSLATE_Y;

  // The measured wrapper stays untransformed on purpose — measuring the animated
  // view itself would fold its own transform into the result.
  return (
    <View
      ref={viewRef}
      onLayout={handleLayout}
      className={containerClassName}
      style={containerStyle}
    >
      <Animated.View
        className={className}
        style={{
          opacity: progress.interpolate({
            inputRange: [0, 0.25, 1],
            outputRange: [0, 1, 1],
          }),
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [translateX, 0],
              }),
            },
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [translateY, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [scale, 1],
              }),
            },
          ],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
