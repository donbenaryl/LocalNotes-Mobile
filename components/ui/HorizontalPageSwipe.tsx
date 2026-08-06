import type { ReactNode } from "react";
import { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useHorizontalPageSwipe } from "@/hooks/useHorizontalPageSwipe";

interface HorizontalPageSwipeProps {
  children: ReactNode;
}

/**
 * Wraps a section shell so a horizontal fling slides the current page off
 * and a peek panel in, then navigates to the mapped sibling route
 * (see constants/swipeNavigation).
 *
 * Requires GestureHandlerRootView at the app root (app/_layout.tsx).
 */
export function HorizontalPageSwipe({ children }: HorizontalPageSwipeProps) {
  const { gesture, currentStyle, peekStyle } = useHorizontalPageSwipe();

  return (
    <View className="flex-1 overflow-hidden">
      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 bg-page dark:bg-gray-900"
        style={peekStyle}
      />
      <GestureDetector gesture={gesture}>
        <Animated.View
          className="flex-1 bg-page dark:bg-gray-900"
          style={currentStyle}
          collapsable={false}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
