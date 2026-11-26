import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  Text,
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
import { WORDMARK_LG_TEXT_CLASS } from '@/components/ui/LocalNotesText';
import { useSplashStore } from '@/stores/useSplashStore';

const WORD = 'LocalNotes';
const LETTERS = WORD.split('');
/** Same two runs as `LocalNotesText`, so kerning matches the final logo. */
const WORDS = ['Local', 'Notes'] as const;
/** Every string we measure: each word prefix plus each lone character. */
const MEASURE_KEYS = WORDS.flatMap((w) =>
  w.split('').flatMap((_, i) => [w.slice(0, i + 1), w[i]]),
);
const L_INDEX = 0;
const N_INDEX = 5;
/** Master intro clock length (ms). */
const INTRO_MS = 1800;
/** Failsafe: never leave the overlay on screen longer than this. */
const FAILSAFE_MS = 6000;
const TRAVEL_MS = 700;
/** Wait for destination layout to settle before locking travel. */
const TRAVEL_RECT_DEBOUNCE_MS = 120;
/** Soft handoff: fade splash after destination text is revealed. */
const HANDOFF_FADE_MS = 200;
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
  /** Kerned x inside the row, measured from the real word run. */
  left: number;
  width: number;
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
  left,
  width,
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
      className={WORDMARK_LG_TEXT_CLASS}
      // Extra width guards against sub-pixel wrapping of absolutely placed text.
      style={[{ position: 'absolute', top: 0, left, width: width + 6 }, style]}
      numberOfLines={1}
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
  const beginReveal = useSplashStore((s) => s.beginReveal);
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
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [rowH, setRowH] = useState(0);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const started = useRef(false);

  const ready = MEASURE_KEYS.every((k) => metrics[k] > 0) && rowH > 0;

  // Kerned x of every letter, taken from the real "Local" / "Notes" runs.
  const letterX: number[] = [];
  let rowWidth = 0;
  if (ready) {
    let wordStart = 0;
    for (const w of WORDS) {
      for (let i = 0; i < w.length; i += 1) {
        letterX.push(wordStart + metrics[w.slice(0, i + 1)] - metrics[w[i]]);
      }
      wordStart += metrics[w];
    }
    rowWidth = wordStart;
  }
  rowW.current = rowWidth;

  // Put L's right edge and N's left edge at the row center.
  const lShift = ready ? rowWidth / 2 - metrics.L - letterX[L_INDEX] : 0;
  const nShift = ready ? rowWidth / 2 - letterX[N_INDEX] : 0;
  useEffect(() => {
    lOffset.value = lShift;
    nOffset.value = nShift;
  }, [lShift, nShift, lOffset, nOffset]);

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
      const { phase: p } = useSplashStore.getState();
      if (p === 'running' || p === 'revealing') {
        fadeOut.value = withTiming(1, { duration: 300 }, (done) => {
          if (done) runOnJS(finish)();
        });
      }
    }, FAILSAFE_MS);
    return () => clearTimeout(id);
  }, [fadeOut, finish]);

  // Travel / fade once the intro is done and the destination is known.
  useEffect(() => {
    if (!introDone || !target || !ready || started.current) return;

    const fadeOverlayAway = (duration: number) => {
      fadeOut.value = withTiming(1, { duration }, (done) => {
        if (done) runOnJS(finish)();
      });
    };

    const fadeAway = () => {
      started.current = true;
      beginReveal();
      fadeOverlayAway(reduceMotion ? 150 : 300);
    };

    if (target === 'none' || reduceMotion) {
      const id = setTimeout(fadeAway, 150);
      return () => clearTimeout(id);
    }

    if (!rects[target]) {
      // Destination logo never reported a position — don't hang the splash.
      const id = setTimeout(() => setTarget('none'), 1500);
      return () => clearTimeout(id);
    }

    // Debounce so travel aims at the settled wordmark rect (e.g. welcome `base`).
    const id = setTimeout(() => {
      if (started.current) return;
      const rect = useSplashStore.getState().rects[target];
      if (!rect) {
        setTarget('none');
        return;
      }

      started.current = true;
      const scale = rowW.current > 0 ? rect.width / rowW.current : 0.5;
      const scaledH = rowH * scale;
      scaleTo.value = scale;
      toColor.value = target === 'welcome' ? CREAM : baseColor;

      const startTravel = (originX: number, originY: number) => {
        dx.value = rect.x + rect.width / 2 - originX;
        // Nudge by half the scaled-vs-target height delta so `base` metrics
        // hand off without a downward jump.
        dy.value =
          rect.y +
          rect.height / 2 -
          originY +
          (rect.height - scaledH) / 2;
        const onTravelDone = () => {
          beginReveal();
          fadeOverlayAway(HANDOFF_FADE_MS);
        };
        travel.value = withTiming(
          1,
          { duration: TRAVEL_MS, easing: Easing.inOut(Easing.cubic) },
          (done) => {
            if (done) runOnJS(onTravelDone)();
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
    }, TRAVEL_RECT_DEBOUNCE_MS);

    return () => clearTimeout(id);
  }, [
    introDone,
    target,
    ready,
    rects,
    reduceMotion,
    baseColor,
    rowH,
    screenW,
    screenH,
    dx,
    dy,
    scaleTo,
    toColor,
    travel,
    fadeOut,
    beginReveal,
    finish,
    setTarget,
  ]);

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
  // Translate and scale on separate nodes so scale does not pull the landed
  // center short of the destination (visible with larger welcome `base` text).
  const wordTranslateStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: travel.value * dx.value },
      { translateY: travel.value * dy.value },
    ],
  }));
  const wordScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (scaleTo.value - 1) * travel.value }],
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
      {/* Hidden measurement layer: real text runs give kerned letter positions. */}
      <View style={styles.measure} pointerEvents="none">
        {MEASURE_KEYS.map((key, k) => (
          <View
            key={`${key}-${k}`}
            style={styles.measureItem}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setMetrics((m) => (m[key] === width ? m : { ...m, [key]: width }));
              setRowH((h) => (h === height ? h : Math.max(h, height)));
            }}
          >
            <Text className={WORDMARK_LG_TEXT_CLASS}>{key}</Text>
          </View>
        ))}
      </View>
      <View
        ref={centerRef}
        collapsable={false}
        style={styles.center}
        pointerEvents="none"
      >
        <Animated.View style={wordTranslateStyle}>
          <Animated.View
            style={[styles.row, { width: rowWidth, height: rowH }, wordScaleStyle]}
          >
            {ready && LETTERS.map((char, i) => (
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
                left={letterX[i]}
                width={metrics[char]}
              />
            ))}
          </Animated.View>
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
  row: { alignItems: 'flex-start' },
  measure: { position: 'absolute', top: 0, left: 0, opacity: 0 },
  measureItem: { alignSelf: 'flex-start' },
});
