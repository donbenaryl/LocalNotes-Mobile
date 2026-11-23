import { useEffect, useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { List, Plus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import type { DropDownOption } from '@/components/ui/DropDown';
import { BRAND } from '@/constants/colors';
import { FOOTER_BAR_HEIGHT } from '@/constants/layout';

const GAP_ABOVE_FAB = 24;
const SLIDE_DISTANCE = 32;
const OPEN_STAGGER_MS = 55;
const CLOSE_STAGGER_MS = 50;
const CLOSE_DURATION_MS = 180;
const UNMOUNT_BUFFER_MS = 40;

const OPEN_SPRING = { damping: 20, stiffness: 300, mass: 0.7 };

/** Per-option icon overrides; anything not listed uses "+". */
const OPTION_ICONS: Record<string, LucideIcon> = {
  'list-drafts': List,
};

const ITEM_SHADOW =Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  android: { elevation: 6 },
  default: {},
});

interface FloatingActionButtonsProps {
  visible: boolean;
  options: DropDownOption[];
  onSelect: (value: string) => void;
  onClose: () => void;
}

interface FloatingItemProps {
  option: DropDownOption;
  /** 0 = closest to the "+" button. It appears first and leaves last. */
  distanceFromFab: number;
  count: number;
  visible: boolean;
  onPress: (value: string) => void;
}

function FloatingItem({
  option,
  distanceFromFab,
  count,
  visible,
  onPress,
}: FloatingItemProps) {
  const progress = useSharedValue(0);
  const { colorScheme } = useColorScheme();
  const Icon = OPTION_ICONS[option.value] ?? Plus;
  const iconColor = colorScheme === 'dark' ? BRAND : '#FFFFFF';

  useEffect(() => {
    cancelAnimation(progress);
    if (visible) {
      progress.value = withDelay(
        distanceFromFab * OPEN_STAGGER_MS,
        withSpring(1, { ...OPEN_SPRING, reduceMotion: ReduceMotion.System }),
      );
    } else {
      progress.value = withDelay(
        (count - 1 - distanceFromFab) * CLOSE_STAGGER_MS,
        withTiming(0, {
          duration: CLOSE_DURATION_MS,
          easing: Easing.in(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
      );
    }
  }, [visible, distanceFromFab, count, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6], [0, 1], 'clamp'),
    transform: [
      { translateY: (1 - progress.value) * SLIDE_DISTANCE },
      { scale: interpolate(progress.value, [0, 1], [0.92, 1], 'clamp') },
    ],
  }));

  return (
    <Animated.View style={[ITEM_SHADOW, animatedStyle]}>
      <LocalNotesButton
        label={option.label}
        onPress={() => onPress(option.value)}
        variant="brand"
        size="sm"
        isRounded
        isWidthFull={false}
        leftIcon={<Icon size={18} color={iconColor} strokeWidth={2.5} />}
        className="min-w-[120px]"
      />
    </Animated.View>
  );
}

/**
 * Buttons that float above the footer "+" button. They spring up one by one
 * (nearest the "+" first) when `visible` turns true, and tuck back down in
 * reverse order before unmounting when it turns false. Render inside the
 * footer's `relative` wrapper.
 */
export function FloatingActionButtons({
  visible,
  options,
  onSelect,
  onClose,
}: FloatingActionButtonsProps) {
  const { width, height } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);
  const count = options.length;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }
    const closeTotalMs =
      Math.max(count - 1, 0) * CLOSE_STAGGER_MS +
      CLOSE_DURATION_MS +
      UNMOUNT_BUFFER_MS;
    const timeoutId = setTimeout(() => setMounted(false), closeTotalMs);
    return () => clearTimeout(timeoutId);
  }, [visible, count]);

  if (!mounted) return null;

  const handlePress = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <>
      {/* Outside-tap catcher; sits under the bar and FAB (rendered first). */}
      <Pressable
        accessibilityLabel="Close"
        onPress={onClose}
        style={{
          position: 'absolute',
          top: -height,
          left: -width,
          width: width * 3,
          height: height * 2,
        }}
      />
      <View
        className="absolute left-0 right-0 z-30 items-center"
        style={{ bottom: FOOTER_BAR_HEIGHT + GAP_ABOVE_FAB - 8 }}
        pointerEvents={visible ? 'box-none' : 'none'}
      >
        <View className="items-center gap-2" pointerEvents="box-none">
          {options.map((option, index) => (
            <FloatingItem
              key={option.value}
              option={option}
              distanceFromFab={count - 1 - index}
              count={count}
              visible={visible}
              onPress={handlePress}
            />
          ))}
        </View>
      </View>
    </>
  );
}
