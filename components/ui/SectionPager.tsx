import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import PagerView, {
  type PagerViewOnPageScrollEvent,
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useIsFocused } from "@react-navigation/native";
import { useRouter, type Href } from "expo-router";
import {
  type SectionId,
  type SwipeEnterDirection,
} from "@/constants/swipeNavigation";
import { useSectionRouteStore } from "@/stores/useSectionRouteStore";
import { navigateToSection } from "@/utils/navigateToSection";

export interface SectionPagerPage {
  id: string;
  href: Href;
  render: () => ReactNode;
}

interface SectionPagerProps {
  pages: SectionPagerPage[];
  activeId: string;
  onActiveIdChange: (id: string) => void;
  /** Header / tab bar rendered inside the animated shell so it slides with content. */
  chrome?: ReactNode;
  /** Cross-section: swipe left on the last page → this footer section. */
  edgeLeftSection?: SectionId;
  /** Cross-section: swipe right on the first page → this footer section. */
  edgeRightSection?: SectionId;
}

const PAGE_COMMIT_THRESHOLD = 0.5;
const SWIPE_DISTANCE_THRESHOLD = 72;
const SWIPE_VELOCITY_THRESHOLD = 700;
const FAIL_OFFSET_Y = 16;
const EDGE_STRIP_WIDTH = 28;
const EXIT_DURATION_MS = 220;
const CANCEL_DURATION_MS = 180;
const SLIDE_EASING = Easing.out(Easing.cubic);

/**
 * Inner-section PagerView with exclusive screen-edge hit strips for
 * cross-section navigation. Strips own the edge gesture and drive a
 * follow-the-finger slide; mid-screen paging stays with PagerView.
 */
export function SectionPager({
  pages,
  activeId,
  onActiveIdChange,
  chrome,
  edgeLeftSection,
  edgeRightSection,
}: SectionPagerProps) {
  const pagerRef = useRef<PagerView>(null);
  const navigatingRef = useRef(false);
  const router = useRouter();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const setActiveHref = useSectionRouteStore((s) => s.setActiveHref);
  const rememberSectionHref = useSectionRouteStore(
    (s) => s.rememberSectionHref,
  );

  const translateX = useSharedValue(0);
  const screenWidth = useSharedValue(width);
  const isAnimating = useSharedValue(0);

  const activeIndex = Math.max(
    0,
    pages.findIndex((page) => page.id === activeId),
  );
  const lastIndex = pages.length - 1;
  const nativePageRef = useRef(activeIndex);

  const showLeftStrip =
    isFocused && activeIndex === 0 && Boolean(edgeRightSection);
  const showRightStrip =
    isFocused && activeIndex === lastIndex && Boolean(edgeLeftSection);

  useEffect(() => {
    screenWidth.value = width;
  }, [screenWidth, width]);

  useEffect(() => {
    if (nativePageRef.current === activeIndex) return;
    nativePageRef.current = activeIndex;
    pagerRef.current?.setPageWithoutAnimation(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    const href = pages[activeIndex]?.href;
    if (!href) return;
    rememberSectionHref(href);
    if (isFocused) setActiveHref(href);
  }, [activeIndex, isFocused, pages, rememberSectionHref, setActiveHref]);

  useEffect(() => {
    if (isFocused) return;
    translateX.value = 0;
    isAnimating.value = 0;
    navigatingRef.current = false;
  }, [isAnimating, isFocused, translateX]);

  const finishNavigate = useCallback(
    (direction: SwipeEnterDirection) => {
      const to =
        direction === "left" ? edgeLeftSection : edgeRightSection;
      if (!to) {
        navigatingRef.current = false;
        isAnimating.value = 0;
        translateX.value = 0;
        return;
      }

      const currentHref = pages[activeIndex]?.href;
      navigateToSection(router, to, { fromHref: currentHref });
    },
    [
      activeIndex,
      edgeLeftSection,
      edgeRightSection,
      isAnimating,
      pages,
      router,
      translateX,
    ],
  );

  const animateExitThenNavigate = useCallback(
    (direction: SwipeEnterDirection) => {
      const to =
        direction === "left" ? edgeLeftSection : edgeRightSection;
      if (!to || navigatingRef.current || isAnimating.value === 1) return;

      navigatingRef.current = true;
      isAnimating.value = 1;
      const target =
        direction === "left" ? -screenWidth.value : screenWidth.value;

      translateX.value = withTiming(
        target,
        { duration: EXIT_DURATION_MS, easing: SLIDE_EASING },
        (finished) => {
          if (finished) {
            runOnJS(finishNavigate)(direction);
          }
        },
      );
    },
    [
      edgeLeftSection,
      edgeRightSection,
      finishNavigate,
      isAnimating,
      screenWidth,
      translateX,
    ],
  );

  const cancelEdgeSlide = useCallback(() => {
    if (isAnimating.value === 1 || navigatingRef.current) return;
    isAnimating.value = 1;
    translateX.value = withTiming(
      0,
      { duration: CANCEL_DURATION_MS, easing: SLIDE_EASING },
      (finished) => {
        if (finished) {
          isAnimating.value = 0;
        }
      },
    );
  }, [isAnimating, translateX]);

  const handleEdgePanEnd = useCallback(
    (direction: SwipeEnterDirection, translationX: number, velocityX: number) => {
      if (navigatingRef.current || isAnimating.value === 1) return;

      const committedLeft =
        direction === "left" &&
        (translationX < -SWIPE_DISTANCE_THRESHOLD ||
          velocityX < -SWIPE_VELOCITY_THRESHOLD);
      const committedRight =
        direction === "right" &&
        (translationX > SWIPE_DISTANCE_THRESHOLD ||
          velocityX > SWIPE_VELOCITY_THRESHOLD);

      if (committedLeft || committedRight) {
        animateExitThenNavigate(direction);
        return;
      }
      cancelEdgeSlide();
    },
    [animateExitThenNavigate, cancelEdgeSlide, isAnimating],
  );

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const index = event.nativeEvent.position;
      nativePageRef.current = index;
      const page = pages[index];
      if (page && page.id !== activeId) {
        onActiveIdChange(page.id);
      }
    },
    [activeId, onActiveIdChange, pages],
  );

  const handlePageScroll = useCallback(
    (event: PagerViewOnPageScrollEvent) => {
      const { position, offset } = event.nativeEvent;
      const settledIndex =
        offset > PAGE_COMMIT_THRESHOLD ? position + 1 : position;
      const settledPage = pages[settledIndex];
      if (settledPage && settledPage.id !== activeId) {
        nativePageRef.current = settledIndex;
        onActiveIdChange(settledPage.id);
      }
    },
    [activeId, onActiveIdChange, pages],
  );

  const renderedPages = useMemo(
    () =>
      pages.map((page) => (
        <View key={page.id} style={styles.fill} collapsable={false}>
          {page.render()}
        </View>
      )),
    [pages],
  );

  // Left strip: first page — swipe right → previous section (edgeRightSection).
  const leftStripPan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(showLeftStrip)
        .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
        .onUpdate((event) => {
          "worklet";
          if (isAnimating.value === 1) return;
          const max = screenWidth.value;
          translateX.value = Math.max(0, Math.min(max, event.translationX));
        })
        .onEnd((event) => {
          "worklet";
          if (isAnimating.value === 1) return;
          runOnJS(handleEdgePanEnd)(
            "right",
            event.translationX,
            event.velocityX,
          );
        })
        .onFinalize((_event, success) => {
          "worklet";
          if (!success && isAnimating.value === 0) {
            runOnJS(cancelEdgeSlide)();
          }
        }),
    [
      cancelEdgeSlide,
      handleEdgePanEnd,
      isAnimating,
      screenWidth,
      showLeftStrip,
      translateX,
    ],
  );

  // Right strip: last page — swipe left → next section (edgeLeftSection).
  const rightStripPan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(showRightStrip)
        .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
        .onUpdate((event) => {
          "worklet";
          if (isAnimating.value === 1) return;
          const max = screenWidth.value;
          translateX.value = Math.max(-max, Math.min(0, event.translationX));
        })
        .onEnd((event) => {
          "worklet";
          if (isAnimating.value === 1) return;
          runOnJS(handleEdgePanEnd)(
            "left",
            event.translationX,
            event.velocityX,
          );
        })
        .onFinalize((_event, success) => {
          "worklet";
          if (!success && isAnimating.value === 0) {
            runOnJS(cancelEdgeSlide)();
          }
        }),
    [
      cancelEdgeSlide,
      handleEdgePanEnd,
      isAnimating,
      screenWidth,
      showRightStrip,
      translateX,
    ],
  );

  const currentStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: translateX.value }],
  }));

  const peekStyle = useAnimatedStyle(() => {
    const w = screenWidth.value;
    const x = translateX.value;
    const peekX = x <= 0 ? x + w : x - w;
    return {
      transform: [{ translateX: peekX }],
    };
  });

  return (
    <View className="flex-1 overflow-hidden">
      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 bg-page dark:bg-gray-900"
        style={peekStyle}
      />
      <Animated.View
        className="flex-1 bg-page dark:bg-gray-900"
        style={currentStyle}
        collapsable={false}
      >
        {chrome}
        <PagerView
          ref={pagerRef}
          style={styles.fill}
          initialPage={activeIndex}
          overdrag={false}
          offscreenPageLimit={Math.max(pages.length - 1, 1)}
          onPageScroll={handlePageScroll}
          onPageSelected={handlePageSelected}
        >
          {renderedPages}
        </PagerView>
      </Animated.View>

      {showLeftStrip ? (
        <GestureDetector gesture={leftStripPan}>
          <View
            style={styles.leftStrip}
            collapsable={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </GestureDetector>
      ) : null}

      {showRightStrip ? (
        <GestureDetector gesture={rightStripPan}>
          <View
            style={styles.rightStrip}
            collapsable={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        </GestureDetector>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  leftStrip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: EDGE_STRIP_WIDTH,
    zIndex: 20,
  },
  rightStrip: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: EDGE_STRIP_WIDTH,
    zIndex: 20,
  },
});
