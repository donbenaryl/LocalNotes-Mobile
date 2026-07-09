import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useWindowDimensions, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface SearchResultsSheetProps {
  children: ReactNode;
  expandedHeightRatio?: number;
  maxExpandedHeight?: number;
  collapsedLabel?: string;
  onCollapsedChange?: (isCollapsed: boolean) => void;
}

const HEADER_HEIGHT = 26;
export const SEARCH_RESULTS_SHEET_COLLAPSED_HEIGHT = 60;
export const SEARCH_RESULTS_SHEET_EXPANDED_HEIGHT_RATIO = 0.5;
export const SEARCH_RESULTS_SHEET_MIN_EXPANDED_HEIGHT = 260;
const COLLAPSE_THRESHOLD = 1;
const SPRING_CONFIG = {
  damping: 22,
  stiffness: 220,
  mass: 0.8,
} as const;

function clamp(value: number, min: number, max: number) {
  "worklet";

  return Math.min(Math.max(value, min), max);
}

export function SearchResultsSheet({
  children,
  expandedHeightRatio = SEARCH_RESULTS_SHEET_EXPANDED_HEIGHT_RATIO,
  maxExpandedHeight,
  collapsedLabel,
  onCollapsedChange,
}: SearchResultsSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const expandedHeight = useMemo(
    () =>
      Math.max(
        windowHeight * expandedHeightRatio,
        SEARCH_RESULTS_SHEET_MIN_EXPANDED_HEIGHT,
      ),
    [expandedHeightRatio, windowHeight],
  );
  const maxSnapHeight = useMemo(
    () =>
      Math.max(
        maxExpandedHeight ?? expandedHeight,
        expandedHeight,
        SEARCH_RESULTS_SHEET_MIN_EXPANDED_HEIGHT,
      ),
    [expandedHeight, maxExpandedHeight],
  );
  const snapHeights = useMemo(() => {
    const heights = [
      SEARCH_RESULTS_SHEET_COLLAPSED_HEIGHT,
      expandedHeight,
      maxSnapHeight,
    ];

    return heights.filter(
      (height, index) => heights.indexOf(height) === index,
    );
  }, [expandedHeight, maxSnapHeight]);

  const sheetHeight = useSharedValue(expandedHeight);
  const panStartHeight = useSharedValue(expandedHeight);
  const collapsedState = useSharedValue(isCollapsed);

  useEffect(() => {
    const nextHeight = collapsedState.value
      ? SEARCH_RESULTS_SHEET_COLLAPSED_HEIGHT
      : clamp(sheetHeight.value, expandedHeight, maxSnapHeight);
    sheetHeight.value = nextHeight;
  }, [collapsedState, expandedHeight, maxSnapHeight, sheetHeight]);

  useAnimatedReaction(
    () =>
      sheetHeight.value <=
      SEARCH_RESULTS_SHEET_COLLAPSED_HEIGHT + COLLAPSE_THRESHOLD,
    (isCollapsed, previousIsCollapsed) => {
      if (isCollapsed === previousIsCollapsed) return;

      collapsedState.value = isCollapsed;
      runOnJS(setIsCollapsed)(isCollapsed);
      if (onCollapsedChange) {
        runOnJS(onCollapsedChange)(isCollapsed);
      }
    },
    [onCollapsedChange],
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      panStartHeight.value = sheetHeight.value;
    })
    .onUpdate((event) => {
      sheetHeight.value = clamp(
        panStartHeight.value - event.translationY,
        SEARCH_RESULTS_SHEET_COLLAPSED_HEIGHT,
        maxSnapHeight,
      );
    })
    .onEnd((event) => {
      const projectedHeight = clamp(
        sheetHeight.value - event.velocityY * 0.08,
        SEARCH_RESULTS_SHEET_COLLAPSED_HEIGHT,
        maxSnapHeight,
      );
      const nextSnapHeight = snapHeights.reduce((closestHeight, snapHeight) => {
        return Math.abs(snapHeight - projectedHeight) <
          Math.abs(closestHeight - projectedHeight)
          ? snapHeight
          : closestHeight;
      }, snapHeights[0]);

      sheetHeight.value = withSpring(
        nextSnapHeight,
        SPRING_CONFIG,
      );
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((_event, success) => {
      if (!success || !collapsedState.value) return;

      collapsedState.value = false;
      sheetHeight.value = withSpring(expandedHeight, SPRING_CONFIG);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
  }));

  const headerGesture = Gesture.Race(panGesture, tapGesture);

  return (
    <GestureHandlerRootView
      style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
    >
      <Animated.View
        className="overflow-hidden rounded-t-2xl border-t border-gray-200 bg-page shadow-sm dark:border-gray-700 dark:bg-gray-900"
        style={[
          { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16 },
          sheetStyle,
        ]}
      >
        <GestureDetector gesture={headerGesture}>
          <View
            className="flex-row items-center justify-center px-4"
            style={{ height: HEADER_HEIGHT }}
          >
            <View className="items-center justify-center px-3">
              <View className="h-1.5 w-24 rounded-full bg-gray-300 opacity-70 dark:bg-gray-600" />
            </View>
          </View>
        </GestureDetector>

        <View className="flex-1">{children}</View>
      </Animated.View>
    </GestureHandlerRootView>
  );
}
