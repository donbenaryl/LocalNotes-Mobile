import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LnTile } from '@/components/ui/LnTile';
import { LocalNotesText } from '@/components/ui/LocalNotesText';
import { useSplashTarget } from '@/hooks/useSplashTarget';
import { useSplashStore } from '@/stores/useSplashStore';

const TILE_SIZE = 30;
/** Matches NativeWind `gap-2` (8px). */
const ROW_GAP = 8;
const TILE_REVEAL_DELAY_MS = 400;
const TILE_REVEAL_MS = 520;

export function WelcomeLogoRow() {
  const logo = useSplashTarget('welcome');
  const splashDone = useSplashStore((s) => s.phase === 'done');
  // Already done on mount (e.g. revisiting welcome) → show tile immediately.
  const tileProgress = useSharedValue(splashDone ? 1 : 0);

  useEffect(() => {
    if (!splashDone || tileProgress.value >= 1) return;
    tileProgress.value = withDelay(
      TILE_REVEAL_DELAY_MS,
      withTiming(1, {
        duration: TILE_REVEAL_MS,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [splashDone, tileProgress]);

  const tileRevealStyle = useAnimatedStyle(() => {
    const progress = tileProgress.value;
    return {
      opacity: progress,
      transform: [
        { translateX: (1 - progress) * (TILE_SIZE + ROW_GAP) },
        { scale: 0.85 + 0.15 * progress },
      ],
    };
  });

  return (
    <View
      className="flex-row items-center justify-center gap-2 self-center"
      accessibilityRole="header"
      accessibilityLabel="LocalNotes"
    >
      <Animated.View style={[{ zIndex: 0 }, tileRevealStyle]}>
        <LnTile size={TILE_SIZE} variant="light" />
      </Animated.View>
      <View
        ref={logo.ref}
        onLayout={logo.onLayout}
        collapsable={false}
        style={{ opacity: logo.hidden ? 0 : 1, zIndex: 1 }}
      >
        <LocalNotesText variant="cream" size="base" withShadow />
      </View>
    </View>
  );
}
