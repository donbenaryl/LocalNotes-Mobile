import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { formatRelativeTime } from '@/utils/time';
import type { PreviousConversation } from '@/http/smart-pick-api/types';

interface SmartPickHistoryRowProps {
  conversation: PreviousConversation;
  onPress: () => void;
}

export function SmartPickHistoryRow({ conversation, onPress }: SmartPickHistoryRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 cursor-pointer dark:border-gray-800 dark:bg-gray-900"
    >
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="font-geist-medium text-sm text-ink dark:text-gray-100" numberOfLines={2}>
          {conversation.label}
        </Text>
        <Text className="font-geist text-[11px] text-gray-400 dark:text-gray-500">
          {formatRelativeTime(conversation.created_at)}
        </Text>
      </View>
      <ChevronRight size={16} color="#9CA3AF" />
    </Pressable>
  );
}
