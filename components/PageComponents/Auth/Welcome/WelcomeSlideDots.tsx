import { Pressable, View } from 'react-native';
import { WELCOME_CREAM } from '@/constants/welcomeScreens';

type WelcomeSlideDotsProps = {
  count: number;
  activeIndex: number;
  onSelectIndex?: (index: number) => void;
};

export function WelcomeSlideDots({
  count,
  activeIndex,
  onSelectIndex,
}: WelcomeSlideDotsProps) {
  return (
    <View
      className="mt-4 flex-row items-center justify-center gap-2"
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
