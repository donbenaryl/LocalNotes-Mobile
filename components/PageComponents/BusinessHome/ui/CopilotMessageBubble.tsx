import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import type { CopilotMessageDAO } from '@/http/business-api/types';
import { canOpenCostSheet, progressLabelKey, sourceChip } from '@/utils/copilot';
import { CopilotAnswerText } from './CopilotAnswerText';

interface CopilotMessageBubbleProps {
  message: CopilotMessageDAO;
  /** Question that produced a failed answer; enables Retry. */
  retryQuestion?: string;
  onOpenCostSheet: (message: CopilotMessageDAO) => void;
  onOpenSource: (route: string) => void;
  onRetry: (question: string) => void;
  retryDisabled?: boolean;
}

/** One chat message: the owner's bubble, or the assistant's card (pending / failed / done). */
export function CopilotMessageBubble({
  message,
  retryQuestion,
  onOpenCostSheet,
  onOpenSource,
  onRetry,
  retryDisabled,
}: CopilotMessageBubbleProps) {
  const { t } = useTranslation();

  if (message.role === 'user') {
    return (
      <View className="max-w-[85%] self-end rounded-2xl bg-ink px-3.5 py-2.5 dark:bg-paper">
        <Text selectable className="font-geist text-sm text-white dark:text-ink">
          {message.content}
        </Text>
      </View>
    );
  }

  if (message.status === 'pending') {
    return (
      <View
        className="flex-row items-center gap-2 self-start rounded-2xl bg-white px-3.5 py-3 dark:bg-gray-800"
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator size="small" color="#FF6B1A" />
        <Text className="font-geist-semibold text-[13px] text-gray-600 dark:text-gray-300">
          {t(progressLabelKey(message.progress))}
        </Text>
      </View>
    );
  }

  if (message.status === 'failed') {
    return (
      <View className="max-w-[90%] self-start rounded-2xl bg-white px-3.5 py-3 dark:bg-gray-800">
        <Text className="font-geist text-sm text-gray-600 dark:text-gray-300">
          {t('businessHome.copilot.failed')}
        </Text>
        {retryQuestion ? (
          <View className="mt-2">
            <LocalNotesButton
              label={t('businessHome.copilot.retry')}
              onPress={() => onRetry(retryQuestion)}
              variant="light"
              size="xs"
              isWidthFull={false}
              disabled={retryDisabled}
            />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View className="w-[95%] self-start rounded-2xl border border-gray-200 bg-white px-3.5 py-3 dark:border-gray-800 dark:bg-gray-900">
      <CopilotAnswerText content={message.content} />
      {message.sources.length > 0 ? (
        <View className="mt-3 flex-row flex-wrap gap-1.5">
          {message.sources.map((key) => {
            const chip = sourceChip(key);
            const label = t(chip.labelKey);
            const { route } = chip;
            return route ? (
              <Pressable
                key={key}
                onPress={() => onOpenSource(route)}
                accessibilityRole="link"
                className="rounded-full bg-soft px-2.5 py-1 active:opacity-70 dark:bg-gray-800"
              >
                <Text className="font-geist-semibold text-[11px] text-brand">{label}</Text>
              </Pressable>
            ) : (
              <View key={key} className="rounded-full bg-soft px-2.5 py-1 dark:bg-gray-800">
                <Text className="font-geist-semibold text-[11px] text-gray-600 dark:text-gray-300">
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
      {canOpenCostSheet(message) ? (
        <Pressable
          onPress={() => onOpenCostSheet(message)}
          accessibilityRole="button"
          accessibilityHint={t('businessHome.copilot.creditsChargedHint')}
          className="mt-2 self-start active:opacity-70"
          hitSlop={8}
        >
          <Text className="font-geist-semibold text-[11px] text-gray-500 underline dark:text-gray-400">
            {t('businessHome.copilot.creditsCharged', { count: message.credits_charged })}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
