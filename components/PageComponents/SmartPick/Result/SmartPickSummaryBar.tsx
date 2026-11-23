import { Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { ConversationMessage } from '@/http/smart-pick-api/types';

interface SmartPickSummaryBarProps {
  messages: ConversationMessage[];
  isStretch: boolean;
  onBack: () => void;
}

/** Collapsed form summary shown above the results (mockup 07.B/07.C top bar). */
export function SmartPickSummaryBar({ messages, isStretch, onBack }: SmartPickSummaryBarProps) {
  const chips = messages.map((m) => m.message).filter(Boolean);
  const lastIndex = chips.length - 1;

  return (
    <View className="flex-row items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-dk-line">
      <Pressable
        onPress={onBack}
        className="h-8 w-8 items-center justify-center rounded-full bg-soft cursor-pointer dark:bg-dk-card"
      >
        <ChevronLeft size={18} color="#1A1714" />
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
        <View className="flex-row gap-1.5">
          {chips.map((label, index) => {
            const isAccent = index === lastIndex;
            return (
              <View
                key={`${label}-${index}`}
                className={`rounded-full px-2.5 py-1.5 ${
                  isAccent
                    ? isStretch
                      ? 'bg-connector-tint'
                      : 'bg-brand-tint'
                    : 'bg-soft dark:bg-dk-card'
                }`}
              >
                <Text
                  className={`font-geist-medium text-[11.5px] ${
                    isAccent
                      ? isStretch
                        ? 'text-connector'
                        : 'text-brand-dark dark:text-dk-text'
                      : 'text-gray-600 dark:text-dk-body'
                  }`}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
