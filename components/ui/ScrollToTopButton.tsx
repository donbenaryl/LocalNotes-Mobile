import { useEffect } from 'react';
import { Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronUp } from 'lucide-react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  FOOTER_BAR_HEIGHT,
  FOOTER_BOTTOM_OVERHANG,
  FOOTER_MIN_INSET,
} from '@/constants/layout';

/** Visible gap between the top of the GuardedFooter bar and this button. */
const FOOTER_GAP = 12;

const ENTER_SPRING = {
  damping: 16,
  stiffness: 220,
  mass: 0.7,
};

const EXIT_TIMING = {
  duration: 180,
  easing: Easing.out(Easing.cubic),
};

const PRESS_SPRING = {
  damping: 18,
  stiffness: 400,
  mass: 0.5,
};

const BOB_EASING = Easing.inOut(Easing.sin);

const BUTTON_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  android: { elevation: 6 },
  default: {},
});

interface ScrollToTopButtonProps {
  visible: boolean;
  onPress: () => void;
}

export function ScrollToTopButton({ visible, onPress }: ScrollToTopButtonProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const progress = useSharedValue(0);
  const press = useSharedValue(0);
  const bob = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = withSpring(1, ENTER_SPRING);
      bob.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 700, easing: BOB_EASING }),
          withTiming(0, { duration: 700, easing: BOB_EASING }),
        ),
        -1,
        false,
      );
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1100, easing: BOB_EASING }),
          withTiming(0, { duration: 1100, easing: BOB_EASING }),
        ),
        -1,
        false,
      );
    } else {
      progress.value = withTiming(0, EXIT_TIMING);
      cancelAnimation(bob);
      cancelAnimation(pulse);
      bob.value = withTiming(0, { duration: 120 });
      pulse.value = withTiming(0, { duration: 120 });
    }
  }, [bob, progress, pulse, visible]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 0.4, 1], [0, 0.85, 1]),
      transform: [
        {
          translateY: interpolate(p, [0, 1], [18, 0]) + bob.value,
        },
        {
          scale:
            interpolate(p, [0, 1], [0.72, 1]) *
            (1 - press.value * 0.12) *
            (1 + pulse.value * 0.04),
        },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      className="absolute right-4 z-30"
      style={[
        {
          // Top edge of the footer bar, derived from the same geometry
          // GuardedFooter uses so the two can't drift apart per platform.
          bottom:
            Math.max(insets.bottom, FOOTER_MIN_INSET) +
            FOOTER_BAR_HEIGHT -
            FOOTER_BOTTOM_OVERHANG +
            FOOTER_GAP,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          press.value = withSpring(1, PRESS_SPRING);
        }}
        onPressOut={() => {
          press.value = withSpring(0, PRESS_SPRING);
        }}
        accessibilityRole="button"
        accessibilityLabel={t('common.scrollToTop')}
        className="h-11 w-11 items-center justify-center rounded-2xl bg-brand border border-gray-200/80 cursor-pointer"
        style={BUTTON_SHADOW}
      >
        <ChevronUp size={22} color={"#fff"} strokeWidth={2.25} />
      </Pressable>
    </Animated.View>
  );
}
