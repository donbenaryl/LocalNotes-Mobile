import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPersonalityGradientColors } from '@/utils/personalityRing';

interface PersonalityNameProps {
  name: string;
  personalityColor?: Record<string, number> | null;
  variant?: 'pill' | 'text';
}

const GRADIENT_FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

export function PersonalityName({ name, personalityColor, variant = 'pill' }: PersonalityNameProps) {
  const gradientColors = getPersonalityGradientColors(personalityColor);
  const dominantColor = gradientColors[0];

  if (variant === 'text') {
    return (
      <Text className="font-geist text-xs" style={{ color: dominantColor }} numberOfLines={1}>
        {name}
      </Text>
    );
  }

  const colors = (
    gradientColors.length === 1
      ? [gradientColors[0], gradientColors[0]]
      : gradientColors.slice(0, 4)
  ) as [string, string, ...string[]];

  return (
    <View className="self-start rounded-full overflow-hidden" style={{ padding: 1 }}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={GRADIENT_FILL}
      />
      <View className="flex-row items-center gap-[7px] rounded-full bg-white dark:bg-ink px-[11px] py-[5px]">
        <View className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: dominantColor }} />
        <Text className="font-geist text-[13px] font-medium" style={{ color: dominantColor }}>
          {name}
        </Text>
      </View>
    </View>
  );
}
