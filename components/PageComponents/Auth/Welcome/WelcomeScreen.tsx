import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  type AppStateStatus,
  Image,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  WELCOME_CROSSFADE_MS,
  WELCOME_GRADIENT_OVERLAY,
  WELCOME_ROTATION_INTERVAL_MS,
  WELCOME_SCREENS,
  WELCOME_SHORT_SCREEN_HEIGHT,
} from '@/constants/welcomeScreens';
import { WelcomeFixedChrome } from './WelcomeFixedChrome';
import { WelcomeScene } from './WelcomeScene';

function randomStartIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

const FADE_CONFIG = {
  duration: WELCOME_CROSSFADE_MS,
  easing: Easing.inOut(Easing.ease),
  reduceMotion: ReduceMotion.System,
} as const;

export function WelcomeScreen() {
  const { height } = useWindowDimensions();
  const showListCard = height >= WELCOME_SHORT_SCREEN_HEIGHT;
  const [bottomChromeTop, setBottomChromeTop] = useState<number | null>(null);

  const startIndex = useMemo(
    () => randomStartIndex(WELCOME_SCREENS.length),
    [],
  );

  const [slotIndexes, setSlotIndexes] = useState<[number, number]>([
    startIndex,
    (startIndex + 1) % WELCOME_SCREENS.length,
  ]);
  const slotIndexesRef = useRef(slotIndexes);
  const visibleSlotRef = useRef<0 | 1>(0);

  const opacity0 = useSharedValue(1);
  const opacity1 = useSharedValue(0);

  const reduceMotionRef = useRef(false);
  const screenReaderRef = useRef(false);
  const appActiveRef = useRef(true);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCrossfadingRef = useRef(false);
  const fadeGenerationRef = useRef(0);

  const advanceRef = useRef<() => void>(() => {});
  const scheduleHoldRef = useRef<() => void>(() => {});

  useEffect(() => {
    slotIndexesRef.current = slotIndexes;
  }, [slotIndexes]);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const canRotate = useCallback(() => {
    return (
      !reduceMotionRef.current &&
      !screenReaderRef.current &&
      appActiveRef.current
    );
  }, []);

  const snapToVisibleSlot = useCallback(() => {
    cancelAnimation(opacity0);
    cancelAnimation(opacity1);
    fadeGenerationRef.current += 1;
    const visible = visibleSlotRef.current;
    opacity0.value = visible === 0 ? 1 : 0;
    opacity1.value = visible === 1 ? 1 : 0;
    isCrossfadingRef.current = false;
  }, [opacity0, opacity1]);

  const prepareHiddenSlot = useCallback((visibleSlot: 0 | 1) => {
    const hiddenSlot = (1 - visibleSlot) as 0 | 1;
    const visibleIndex = slotIndexesRef.current[visibleSlot];
    const nextIndex = (visibleIndex + 1) % WELCOME_SCREENS.length;

    setSlotIndexes((prev) => {
      if (prev[hiddenSlot] === nextIndex) return prev;
      const next: [number, number] = [prev[0], prev[1]];
      next[hiddenSlot] = nextIndex;
      return next;
    });
  }, []);

  const onFadeComplete = useCallback(
    (toSlot: 0 | 1, generation: number) => {
      if (generation !== fadeGenerationRef.current) return;

      visibleSlotRef.current = toSlot;
      isCrossfadingRef.current = false;
      prepareHiddenSlot(toSlot);
      scheduleHoldRef.current();
    },
    [prepareHiddenSlot],
  );

  const advance = useCallback(() => {
    if (isCrossfadingRef.current) return;
    if (!canRotate()) return;

    const fromSlot = visibleSlotRef.current;
    const toSlot = (1 - fromSlot) as 0 | 1;
    const fromOpacity = fromSlot === 0 ? opacity0 : opacity1;
    const toOpacity = toSlot === 0 ? opacity0 : opacity1;

    isCrossfadingRef.current = true;
    const generation = ++fadeGenerationRef.current;

    cancelAnimation(opacity0);
    cancelAnimation(opacity1);

    toOpacity.value = withTiming(1, FADE_CONFIG);
    fromOpacity.value = withTiming(0, FADE_CONFIG, (finished) => {
      if (!finished) return;
      runOnJS(onFadeComplete)(toSlot, generation);
    });
  }, [canRotate, onFadeComplete, opacity0, opacity1]);

  const scheduleHold = useCallback(() => {
    clearHoldTimer();
    if (!canRotate()) return;

    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      advanceRef.current();
    }, WELCOME_ROTATION_INTERVAL_MS);
  }, [canRotate, clearHoldTimer]);

  advanceRef.current = advance;
  scheduleHoldRef.current = scheduleHold;

  useEffect(() => {
    WELCOME_SCREENS.forEach((screen) => {
      const resolved = Image.resolveAssetSource(screen.background);
      if (resolved?.uri) {
        void Image.prefetch(resolved.uri);
      }
    });
  }, []);

  // Mount once: a11y + app-state listeners. Timer control goes through refs so
  // re-renders never clear an in-flight 5s hold via effect cleanup.
  useEffect(() => {
    let mounted = true;

    async function loadA11y() {
      const [reduceMotion, screenReader] = await Promise.all([
        AccessibilityInfo.isReduceMotionEnabled(),
        AccessibilityInfo.isScreenReaderEnabled(),
      ]);
      if (!mounted) return;
      reduceMotionRef.current = reduceMotion;
      screenReaderRef.current = screenReader;
      if (canRotate()) {
        scheduleHoldRef.current();
      }
    }

    void loadA11y();

    const reduceSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        reduceMotionRef.current = enabled;
        if (enabled) {
          clearHoldTimer();
          snapToVisibleSlot();
        } else {
          scheduleHoldRef.current();
        }
      },
    );

    const readerSub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        screenReaderRef.current = enabled;
        if (enabled) {
          clearHoldTimer();
        } else {
          scheduleHoldRef.current();
        }
      },
    );

    const appSub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        appActiveRef.current = nextState === 'active';
        if (nextState === 'active') {
          scheduleHoldRef.current();
        } else {
          clearHoldTimer();
        }
      },
    );

    return () => {
      mounted = false;
      clearHoldTimer();
      reduceSub.remove();
      readerSub.remove();
      appSub.remove();
    };
    // Intentionally mount-once; rotation helpers are accessed via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slot0Style = useAnimatedStyle(() => ({
    opacity: opacity0.value,
  }));

  const slot1Style = useAnimatedStyle(() => ({
    opacity: opacity1.value,
  }));

  const screen0 = WELCOME_SCREENS[slotIndexes[0]];
  const screen1 = WELCOME_SCREENS[slotIndexes[1]];

  return (
    <View className="flex-1 bg-ink">
      <StatusBar style="light" />

      <Animated.View className="absolute inset-0" style={slot0Style}>
        <Image
          source={screen0.background}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
        />
        <WelcomeScene
          screen={screen0}
          showListCard={showListCard}
          bottomChromeTop={bottomChromeTop}
        />
      </Animated.View>

      <Animated.View className="absolute inset-0" style={slot1Style}>
        <Image
          source={screen1.background}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
        />
        <WelcomeScene
          screen={screen1}
          showListCard={showListCard}
          bottomChromeTop={bottomChromeTop}
        />
      </Animated.View>

      <View className="absolute inset-0" pointerEvents="none">
        <Image
          source={WELCOME_GRADIENT_OVERLAY}
          className="h-full w-full"
          resizeMode="stretch"
        />
      </View>

      <WelcomeFixedChrome onBottomChromeTop={setBottomChromeTop} />
    </View>
  );
}
