import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { LnTile } from '@/components/ui/LnTile';
import { useSplashStore } from '@/stores/useSplashStore';

const WORD = 'LocalNotes';
const LETTERS = WORD.split('');
const L_INDEX = 0;
const N_INDEX = 5;
/** Master intro clock length (ms). */
const INTRO_MS = 1800;
/** Failsafe: never leave the overlay on screen longer than this. */
const FAILSAFE_MS = 6000;
const TRAVEL_MS = 700;
const CREAM = '#F7F3EC';
const INK = '#1A1714';

const clamp = Extrapolation.CLAMP;

interface LetterProps {
  char: string;
  index: number;
  clock: SharedValue<number>;
  travel: SharedValue<number>;
  toColor: SharedValue<string>;
  fromColor: string;
  /** Translation that brings L (resp. N) next to the row center. */
  lOffset: SharedValue<number>;
  nOffset: SharedValue<number>;
  onLayoutX: (index: number, x: number, width: number) => void;
}

function Letter({
  char,
  index,
  clock,
  travel,
  toColor,
  fromColor,
  lOffset,
  nOffset,
  onLayoutX,
}: LetterProps) {
  const isKey = index === L_INDEX || index === N_INDEX;
  // Non-key letters reveal left to right after L and N start sliding.
  const order = index > N_INDEX ? index - 2 : index - 1;
  const start = 800 + order * 60;

  const style = useAnimatedStyle(() => {
    const t = clock.value;
    const color = interpolateColor(
      travel.value,
      [0, 1],
      [fromColor, toColor.value],
    );
    if (isKey) {
      const p = interpolate(t, [650, 1250], [0, 1], clamp);
      const eased = 1 - Math.pow(1 - p, 3);
      const offset = index === L_INDEX ? lOffset.value : nOffset.value;
      return {
        color,
        opacity: interpolate(t, [500, 700], [0, 1], clamp),
        transform: [{ translateX: offset * (1 - eased) }],
      };
    }
    return {
      color,
      opacity: interpolate(t, [start, start + 350], [0, 1], clamp),
      transform: [
        { translateY: interpolate(t, [start, start + 350], [6, 0], clamp) },
      ],
    };
  });

  return (
    <Animated.Text
      className="font-madimi text-5xl pt-1"
      style={style}
      onLayout={(e) =>
        onLayoutX(index, e.nativeEvent.layout.x, e.nativeEvent.layout.width)
      }
    >
      {char}
    </Animated.Text>
  );
}

/**
 * Full-screen opening animation: "Ln" tile -> "LocalNotes" wordmark -> travels
 * onto the logo of whichever screen the session bootstrap resolved to.
 */
export function SplashOverlay() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width: screenW, height: screenH } = useWindowDimensions();

  const phase = useSplashStore((s) => s.phase);
  const target = useSplashStore((s) => s.target);
  const rects = useSplashStore((s) => s.rects);
  const setTarget = useSplashStore((s) => s.setTarget);
  const finish = useSplashStore((s) => s.finish);
  const markIntroDone = useSplashStore((s) => s.setIntroDone);

  const baseColor = isDark ? CREAM : INK;

  const clock = useSharedValue(0);
  const travel = useSharedValue(0);
  const fadeOut = useSharedValue(0);
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const scaleTo = useSharedValue(1);
  const toColor = useSharedValue(baseColor);
  const lOffset = useSharedValue(0);
  const nOffset = useSharedValue(0);

  const rowW = useRef(0);
  const centerRef = useRef<View>(null);
  const letterBox = useRef<Record<number, { x: number; width: number }>>({});
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Intro: one master clock drives the tile + every letter.
  useEffect(() => {
    if (reduceMotion === null) return;
    if (reduceMotion) {
      clock.value = INTRO_MS;
      setIntroDone(true);
      markIntroDone();
      return;
    }
    clock.value = withTiming(
      INTRO_MS,
      { duration: INTRO_MS, easing: Easing.linear },
      (done) => {
        if (done) {
          runOnJS(setIntroDone)(true);
          runOnJS(markIntroDone)();
        }
      },
    );
  }, [reduceMotion, clock, markIntroDone]);

  // Failsafe so a missing target/rect can never leave the overlay stuck.
  useEffect(() => {
    const id = setTimeout(() => {
      if (useSplashStore.getState().phase === 'running') {
        fadeOut.value = withTiming(1, { duration: 300 }, (done) => {
          if (done) runOnJS(finish)();
        });
      }
    }, FAILSAFE_MS);
    return () => clearTimeout(id);
  }, [fadeOut, finish]);

  // Travel / fade once the intro is done and the destination is known.
  useEffect(() => {
    if (!introDone || !target || started.current) return;

    const fadeAway = () => {
      started.current = true;
      fadeOut.value = withTiming(
        1,
        { duration: reduceMotion ? 150 : 300 },
        (done) => {
          if (done) runOnJS(finish)();
        },
      );
    };

    if (target === 'none' || reduceMotion) {
      const id = setTimeout(fadeAway, 150);
      return () => clearTimeout(id);
    }

    const rect = rects[target];
    if (!rect) {
      // Destination logo never reported a position — don't hang the splash.
      const id = setTimeout(() => setTarget('none'), 1500);
      return () => clearTimeout(id);
    }

    started.current = true;
    const scale = rowW.current > 0 ? rect.width / rowW.current : 0.5;
    scaleTo.value = scale;
    toColor.value = target === 'welcome' ? CREAM : baseColor;

    const startTravel = (originX: number, originY: number) => {
      dx.value = rect.x + rect.width / 2 - originX;
      dy.value = rect.y + rect.height / 2 - originY;
      travel.value = withTiming(
        1,
        { duration: TRAVEL_MS, easing: Easing.inOut(Easing.cubic) },
        (done) => {
          if (done) runOnJS(finish)();
        },
      );
    };

    // The word row is centered inside this full-screen container, so its
    // center is the container's center. Measure it in the same (window)
    // coordinate space as the target rect: on Android (edge-to-edge) the
    // useWindowDimensions() size differs from the real overlay by the system
    // bar insets, which made the wordmark overshoot upward.
    const container = centerRef.current;
    if (container) {
      container.measureInWindow((x, y, w, h) => {
        if (w > 0 && h > 0) startTravel(x + w / 2, y + h / 2);
        else startTravel(screenW / 2, screenH / 2);
      });
    } else {
      startTravel(screenW / 2, screenH / 2);
    }
  }, [
    introDone,
    target,
    rects,
    reduceMotion,
    baseColor,
    screenW,
    screenH,
    dx,
    dy,
    scaleTo,
    toColor,
    travel,
    fadeOut,
    finish,
    setTarget,
  ]);

  const recomputeCenterOffset = () => {
    const l = letterBox.current[L_INDEX];
    const n = letterBox.current[N_INDEX];
    if (!l || !n || rowW.current <= 0) return;
    // Put L's right edge and N's left edge at the row center.
    lOffset.value = rowW.current / 2 - l.width - l.x;
    nOffset.value = rowW.current / 2 - n.x;
  };

  const handleLetterLayout = (index: number, x: number, width: number) => {
    letterBox.current[index] = { x, width };
    recomputeCenterOffset();
  };

  const rootStyle = useAnimatedStyle(() => ({ opacity: 1 - fadeOut.value }));
  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(travel.value, [0, 0.8], [1, 0], clamp),
  }));
  const tileStyle = useAnimatedStyle(() => ({
    opacity: interpolate(clock.value, [350, 550], [1, 0], clamp),
    transform: [
      { scale: interpolate(clock.value, [0, 400], [1.08, 1], clamp) },
    ],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: travel.value * dx.value },
      { translateY: travel.value * dy.value },
      { scale: 1 + (scaleTo.value - 1) * travel.value },
    ],
  }));

  if (phase === 'done') return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, rootStyle]}
      pointerEvents="auto"
      accessibilityRole="image"
      accessibilityLabel="LocalNotes"
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isDark ? '#161412' : '#F7F3EC' },
          bgStyle,
        ]}
      />
      <View style={styles.center} pointerEvents="none">
        <Animated.View style={tileStyle}>
          <LnTile />
        </Animated.View>
      </View>
      <View
        ref={centerRef}
        collapsable={false}
        style={styles.center}
        pointerEvents="none"
      >
        <Animated.View
          style={[styles.row, wordStyle]}
          onLayout={(e) => {
            rowW.current = e.nativeEvent.layout.width;
            recomputeCenterOffset();
          }}
        >
          {LETTERS.map((char, i) => (
            <Letter
              key={`${char}-${i}`}
              char={char}
              index={i}
              clock={clock}
              travel={travel}
              toColor={toColor}
              fromColor={baseColor}
              lOffset={lOffset}
              nOffset={nOffset}
              onLayoutX={handleLetterLayout}
            />
          ))}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 1000, elevation: 1000 },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});
