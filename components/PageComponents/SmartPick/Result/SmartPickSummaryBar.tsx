import { Pressable, ScrollView, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { CategoryChip } from '@/components/ui/CategoryChip';
import type { ConversationMessage } from '@/http/smart-pick-api/types';

interface SmartPickSummaryBarProps {
  messages: ConversationMessage[];
  onBack: () => void;
}

/** Collapsed form summary shown above the results (mockup 07.B/07.C top bar). */
export function SmartPickSummaryBar({ messages, onBack }: SmartPickSummaryBarProps) {
  const { colorScheme } = useColorScheme();
  const chevronColor = colorScheme === 'dark' ? '#FFFFFF' : '#1A1714';
  const chips = messages.map((m) => m.message).filter(Boolean);
  const lastIndex = chips.length - 1;

  return (
    <View className="flex-row items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-dk-line">
      <Pressable
        onPress={onBack}
        className="h-8 w-8 items-center justify-center rounded-full bg-soft cursor-pointer dark:bg-dk-card"
      >
        <ChevronLeft size={18} color={chevronColor} />
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View className="flex-row gap-1.5">
          {chips.map((label, index) => (
            <CategoryChip
              key={`${label}-${index}`}
              label={label}
              isSelected={index === lastIndex}
              onPress={() => {}}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
