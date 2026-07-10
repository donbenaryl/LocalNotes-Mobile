import { Pressable, Text, View } from 'react-native';
import { RadioButton } from '@/components/ui/RadioButton';
import type { SmartPickEngineOption } from '@/constants/smartPick';

interface EngineCardProps {
  option: SmartPickEngineOption;
  isSelected: boolean;
  onPress: () => void;
}

export function EngineCard({ option, isSelected, onPress }: EngineCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl border px-3.5 py-3 cursor-pointer ${
        isSelected
          ? 'border-brand bg-brand-tint dark:bg-brand-tint/5'
          : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      <View
        className={`h-9 w-9 items-center justify-center rounded-[10px] ${
          isSelected ? 'bg-white dark:bg-gray-800' : 'bg-soft dark:bg-gray-800'
        }`}
      >
        <Text className="text-base">{option.emoji}</Text>
      </View>

      <View className="min-w-0 flex-1">
        <Text className="font-geist-semibold text-[13.5px] text-ink dark:text-gray-100">
          {option.name}
        </Text>
        <Text
          className={`font-fraunces text-[11.5px] ${
            isSelected ? 'text-brand-dark' : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {option.detail}
        </Text>
      </View>

      <RadioButton selected={isSelected} />
    </Pressable>
  );
}
