import { Pressable, View } from 'react-native';
import { WELCOME_CREAM } from '@/constants/welcomeScreens';

type WelcomeSlideDotsProps = {
  count: number;
  activeIndex: number;
  onSelectIndex?: (index: number) => void;
  compact?: boolean;
};

export function WelcomeSlideDots({
  count,
  activeIndex,
  onSelectIndex,
  compact = false,
}: WelcomeSlideDotsProps) {
  return (
    <View
      className={`flex-row items-center justify-center gap-2 ${compact ? 'mt-2.5' : 'mt-4'}`}
      accessibilityRole="adjustable"
      accessibilityLabel={`Slide ${activeIndex + 1} of ${count}`}
    >
      {Array.from({ length: count }).map((_, index) => {
        const active = index === activeIndex;
        return (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`Go to slide ${index + 1}`}
            accessibilityState={{ selected: active }}
            hitSlop={10}
            onPress={() => onSelectIndex?.(index)}
            disabled={!onSelectIndex}
          >
            <View
              className="h-[7px] w-[7px] rounded-full"
              style={{
                backgroundColor: active ? WELCOME_CREAM : 'rgba(243,235,221,0.35)',
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
