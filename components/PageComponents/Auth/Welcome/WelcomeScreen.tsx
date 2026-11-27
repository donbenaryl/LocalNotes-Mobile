import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  WELCOME_CROSSFADE_MS,
  WELCOME_SLIDE_INTERVAL_MS,
  WELCOME_SLIDES,
} from '@/constants/welcomeScreens';
import { WelcomeFixedChrome } from './WelcomeFixedChrome';
import { WelcomeLogoRow } from './WelcomeLogoRow';
import { WelcomeSlideMid } from './WelcomeSlideMid';

const SLIDE_COUNT = WELCOME_SLIDES.length;
const SWIPE_DISTANCE_PX = 48;
const SWIPE_VELOCITY_PX = 500;
/** If onLoad is missed after a source swap, still fade in. */
const FADE_IN_LOAD_FAILSAFE_MS = 300;

function wrapIndex(index: number) {
  return ((index % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT;
}

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const fade = useSharedValue(1);
  const advancingRef = useRef(false);
  const pendingFadeInRef = useRef(false);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  // Warm decode so the first 0→1 crossfade does not flash the prior photo.
  useEffect(() => {
    for (const entry of WELCOME_SLIDES) {
      const resolved = Image.resolveAssetSource(entry.background);
      if (resolved?.uri) {
        void Image.prefetch(resolved.uri);
      }
    }
  }, []);

  const startFadeIn = useCallback(() => {
    if (!pendingFadeInRef.current) return;
    pendingFadeInRef.current = false;
    advancingRef.current = false;
    fade.value = withTiming(1, {
      duration: WELCOME_CROSSFADE_MS / 2,
      easing: Easing.inOut(Easing.quad),
      reduceMotion: ReduceMotion.System,
    });
  }, [fade]);

  useEffect(() => {
    if (!pendingFadeInRef.current) return;
    const id = setTimeout(startFadeIn, FADE_IN_LOAD_FAILSAFE_MS);
    return () => clearTimeout(id);
  }, [activeIndex, startFadeIn]);

  const applySlideIndex = useCallback((nextIndex: number) => {
    advancingRef.current = true;
    pendingFadeInRef.current = true;
    setActiveIndex(wrapIndex(nextIndex));
  }, []);

  const goToSlide = useCallback(
    (nextIndex: number) => {
      const target = wrapIndex(nextIndex);
      if (advancingRef.current || target === activeIndexRef.current) return;

      fade.value = withTiming(
        0,
        {
          duration: WELCOME_CROSSFADE_MS / 2,
          easing: Easing.inOut(Easing.quad),
          reduceMotion: ReduceMotion.System,
        },
        (finished) => {
          if (finished) runOnJS(applySlideIndex)(target);
        },
      );
    },
    [applySlideIndex, fade],
  );

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      goToSlide(activeIndexRef.current + 1);
    }, WELCOME_SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [activeIndex, goToSlide, reduceMotion]);

  const handleSwipe = useCallback(
    (direction: 'next' | 'prev') => {
      goToSlide(activeIndexRef.current + (direction === 'next' ? 1 : -1));
    },
    [goToSlide],
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-20, 20])
    .onEnd((event) => {
      'worklet';
      const wentNext =
        event.translationX < -SWIPE_DISTANCE_PX || event.velocityX < -SWIPE_VELOCITY_PX;
      const wentPrev =
        event.translationX > SWIPE_DISTANCE_PX || event.velocityX > SWIPE_VELOCITY_PX;
      if (wentNext) {
        runOnJS(handleSwipe)('next');
      } else if (wentPrev) {
        runOnJS(handleSwipe)('prev');
      }
    });

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  const slide = WELCOME_SLIDES[activeIndex] ?? WELCOME_SLIDES[0];
  const topPad = Math.max(insets.top + 12, 44);
  const compact = height < 740;

  return (
    <GestureDetector gesture={panGesture}>
      <View className="flex-1 bg-ink" style={{ minHeight: height }}>
        <StatusBar style="light" />

        <Animated.View className="absolute inset-0" style={fadeStyle}>
          <Image
            source={slide.background}
            className="absolute inset-0 h-full w-full"
            resizeMode="cover"
            onLoad={startFadeIn}
          />
          <LinearGradient
            colors={[...slide.gradientColors]}
            locations={[...slide.gradientLocations]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </Animated.View>

        <View
          className="flex-1"
          style={{ paddingTop: topPad, paddingBottom: insets.bottom + 8 }}
          pointerEvents="box-none"
        >
          <WelcomeLogoRow />

          <Animated.View
            className="shrink overflow-hidden"
            style={fadeStyle}
            pointerEvents="box-none"
          >
            <WelcomeSlideMid mid={slide.mid} compact={compact} />
          </Animated.View>

          <View className="min-h-2 flex-1" pointerEvents="none" />

          <WelcomeFixedChrome
            activeIndex={activeIndex}
            slideCount={SLIDE_COUNT}
            onSelectIndex={goToSlide}
            compact={compact}
          />
        </View>
      </View>
    </GestureDetector>
  );
}
