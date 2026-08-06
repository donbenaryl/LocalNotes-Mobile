import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useWindowDimensions } from "react-native";
import { usePathname, useRouter, type Href } from "expo-router";
import { Gesture } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  getSwipeTargets,
  isSearchHref,
  isSearchPathname,
  pathnameToAppHref,
} from "@/constants/swipeNavigation";
import { useSearchChromeStore } from "@/stores/useSearchChromeStore";
import {
  useSwipeTransitionStore,
  type SwipeEnterDirection,
} from "@/stores/useSwipeTransitionStore";

/** Horizontal travel required to commit a page change. */
const SWIPE_DISTANCE_THRESHOLD = 72;
/** Velocity (px/s) that commits even with shorter travel. */
const SWIPE_VELOCITY_THRESHOLD = 700;
/**
 * Pan must move this far horizontally before activating — keeps small pans
 * with nested horizontal ScrollViews (Spotlight carousels, filter chips).
 */
const ACTIVE_OFFSET_X = 48;
/** Fail the page-swipe gesture once vertical scroll clearly wins. */
const FAIL_OFFSET_Y = 16;

const SLIDE_DURATION_MS = 260;
const SLIDE_EASING = Easing.out(Easing.cubic);

function initialTranslateForEnter(width: number): number {
  const { enterDirection, enterFromX } =
    useSwipeTransitionStore.getState();
  if (enterFromX != null) return enterFromX;
  if (enterDirection === "left") return width;
  if (enterDirection === "right") return -width;
  return 0;
}

export function useHorizontalPageSwipe() {
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const setReturnTo = useSearchChromeStore((s) => s.setReturnTo);
  const setEnterTransition = useSwipeTransitionStore(
    (s) => s.setEnterTransition,
  );
  const clearEnterTransition = useSwipeTransitionStore(
    (s) => s.clearEnterTransition,
  );

  const translateX = useSharedValue(initialTranslateForEnter(width));
  const screenWidth = useSharedValue(width);
  const canGoLeft = useSharedValue(0);
  const canGoRight = useSharedValue(0);
  const isAnimating = useSharedValue(0);

  const navigatingRef = useRef(false);
  const leftHrefRef = useRef<Href | undefined>(undefined);
  const rightHrefRef = useRef<Href | undefined>(undefined);
  const pathnameRef = useRef(pathname);

  const targets = useMemo(() => getSwipeTargets(pathname), [pathname]);

  useEffect(() => {
    screenWidth.value = width;
  }, [screenWidth, width]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const navigateTo = useCallback(
    (href: Href) => {
      const fromSearch = isSearchPathname(pathnameRef.current);
      const toSearch = isSearchHref(href);

      if (toSearch && !fromSearch) {
        setReturnTo(pathnameToAppHref(pathnameRef.current));
      }
      if (fromSearch && !toSearch) {
        setReturnTo(null);
      }

      router.replace(href);
    },
    [router, setReturnTo],
  );

  const resetTranslate = useCallback(() => {
    isAnimating.value = 1;
    translateX.value = withTiming(
      0,
      { duration: 180, easing: SLIDE_EASING },
      (finished) => {
        if (finished) {
          isAnimating.value = 0;
        }
      },
    );
  }, [isAnimating, translateX]);

  const runEnterAnimation = useCallback(
    (fromX: number) => {
      // Place incoming page where the peek was so real content appears immediately.
      translateX.value = fromX;
      isAnimating.value = 1;
      translateX.value = withTiming(
        0,
        { duration: SLIDE_DURATION_MS, easing: SLIDE_EASING },
        (finished) => {
          if (finished) {
            isAnimating.value = 0;
            runOnJS(clearEnterTransition)();
          }
        },
      );
    },
    [clearEnterTransition, isAnimating, translateX],
  );

  useLayoutEffect(() => {
    leftHrefRef.current = targets.left;
    rightHrefRef.current = targets.right;
    canGoLeft.value = targets.left ? 1 : 0;
    canGoRight.value = targets.right ? 1 : 0;

    const { enterDirection, enterFromX } =
      useSwipeTransitionStore.getState();
    if (enterDirection) {
      const w = screenWidth.value;
      const fromX =
        enterFromX ?? (enterDirection === "left" ? w : -w);
      runEnterAnimation(fromX);
      navigatingRef.current = false;
      return;
    }

    if (!navigatingRef.current) {
      translateX.value = 0;
      isAnimating.value = 0;
    }
    navigatingRef.current = false;
  }, [
    canGoLeft,
    canGoRight,
    isAnimating,
    pathname,
    runEnterAnimation,
    screenWidth,
    targets.left,
    targets.right,
    translateX,
  ]);

  /**
   * Navigate immediately and slide the real next page in from the peek
   * offset — no blank full-screen hold between exit and enter.
   */
  const commitSwipe = useCallback(
    (
      direction: SwipeEnterDirection,
      href: Href,
      currentX: number,
    ) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;
      isAnimating.value = 1;

      const w = screenWidth.value;
      // Peek sits one screen beside the current page at currentX.
      const enterFromX = direction === "left" ? currentX + w : currentX - w;

      setEnterTransition(direction, enterFromX);
      navigateTo(href);
    },
    [isAnimating, navigateTo, screenWidth, setEnterTransition],
  );

  const handleSwipeEnd = useCallback(
    (translationX: number, velocityX: number) => {
      if (navigatingRef.current) return;

      const goLeft =
        (translationX < -SWIPE_DISTANCE_THRESHOLD ||
          velocityX < -SWIPE_VELOCITY_THRESHOLD) &&
        Boolean(leftHrefRef.current);
      const goRight =
        (translationX > SWIPE_DISTANCE_THRESHOLD ||
          velocityX > SWIPE_VELOCITY_THRESHOLD) &&
        Boolean(rightHrefRef.current);

      if (goLeft && leftHrefRef.current) {
        commitSwipe("left", leftHrefRef.current, translationX);
        return;
      }
      if (goRight && rightHrefRef.current) {
        commitSwipe("right", rightHrefRef.current, translationX);
        return;
      }
      resetTranslate();
    },
    [commitSwipe, resetTranslate],
  );

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
      .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
      .onUpdate((event) => {
        "worklet";
        if (isAnimating.value === 1) return;

        const { translationX } = event;
        if (translationX < 0 && canGoLeft.value === 0) {
          translateX.value = 0;
          return;
        }
        if (translationX > 0 && canGoRight.value === 0) {
          translateX.value = 0;
          return;
        }

        const max = screenWidth.value;
        translateX.value = Math.max(-max, Math.min(max, translationX));
      })
      .onEnd((event) => {
        "worklet";
        if (isAnimating.value === 1) return;
        runOnJS(handleSwipeEnd)(event.translationX, event.velocityX);
      })
      .onFinalize((_event, success) => {
        "worklet";
        if (!success && isAnimating.value === 0) {
          runOnJS(resetTranslate)();
        }
      });
  }, [
    canGoLeft,
    canGoRight,
    handleSwipeEnd,
    isAnimating,
    resetTranslate,
    screenWidth,
    translateX,
  ]);

  const currentStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: translateX.value }],
  }));

  /** Neighbor peek rides one screen beside the current page while dragging. */
  const peekStyle = useAnimatedStyle(() => {
    const w = screenWidth.value;
    const x = translateX.value;
    const peekX = x <= 0 ? x + w : x - w;
    return {
      transform: [{ translateX: peekX }],
    };
  });

  return {
    gesture,
    currentStyle,
    peekStyle,
  };
}
