import { Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUp } from 'lucide-react-native';
import type { AiCreditsDAO } from '@/http/business-api/types';
import { creditsLevel, isShortenedAnswerBudget, resetDateLabel } from '@/utils/aiCredits';
import { COPILOT_MAX_MESSAGE_CHARS } from '@/utils/copilot';
import { cn } from '@/utils/cn';

interface CopilotComposerProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  /** False while an answer is pending, the pool is empty, or Copilot is unavailable. */
  canSend: boolean;
  /** False at 0 credits / when unavailable: the field itself is locked. */
  editable: boolean;
  credits?: AiCreditsDAO;
  unavailable: boolean;
  showLongHint: boolean;
  onOpenHow: () => void;
  onOpenCredits: () => void;
  onNewChat: () => void;
}

/** Message field with the credit hints and banners that sit above it. */
export function CopilotComposer({
  value,
  onChangeText,
  onSend,
  canSend,
  editable,
  credits,
  unavailable,
  showLongHint,
  onOpenHow,
  onOpenCredits,
  onNewChat,
}: CopilotComposerProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const level = credits ? creditsLevel(credits.percent, credits.remaining) : 'normal';
  const date = credits ? resetDateLabel(credits.resets_at, i18n.language) : '';

  return (
    <View
      className="border-t border-gray-100 bg-page px-4 pt-2 dark:border-gray-800 dark:bg-gray-900"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {unavailable ? (
        <Text className="pb-2 font-geist-semibold text-xs text-gray-600 dark:text-gray-300">
          {t('businessHome.copilot.unavailable')}
        </Text>
      ) : null}

      {credits && level === 'empty' ? (
        <View className="mb-2 flex-row items-center justify-between gap-3 rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-950/40">
          <Text className="flex-1 font-geist-semibold text-xs text-rose-700 dark:text-rose-300">
            {t('businessHome.copilot.exhaustedBanner', { allowance: credits.allowance, date })}
          </Text>
          <Pressable onPress={onOpenCredits} accessibilityRole="link" hitSlop={8}>
            <Text className="font-geist-bold text-xs text-brand">
              {t('businessHome.copilot.seeCredits')}
            </Text>
          </Pressable>
        </View>
      ) : credits && level === 'warning' ? (
        <View className="mb-2 flex-row items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2 dark:bg-amber-950/40">
          <Text className="flex-1 font-geist-semibold text-xs text-amber-700 dark:text-amber-300">
            {t('businessHome.copilot.lowBanner')}
          </Text>
          <Pressable onPress={onOpenCredits} accessibilityRole="link" hitSlop={8}>
            <Text className="font-geist-bold text-xs text-brand">
              {t('businessHome.copilot.seeCredits')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {showLongHint ? (
        <View className="mb-2 flex-row items-center justify-between gap-3">
          <Text className="flex-1 font-geist text-xs text-gray-600 dark:text-gray-400">
            {t('businessHome.copilot.longConversationHint')}
          </Text>
          <Pressable onPress={onNewChat} accessibilityRole="button" hitSlop={8}>
            <Text className="font-geist-bold text-xs text-brand">
              {t('businessHome.copilot.newChat')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View className="flex-row items-end gap-2">
        <View className="min-h-11 flex-1 justify-center rounded-2xl border border-gray-200 bg-white px-3.5 py-1.5 dark:border-gray-700 dark:bg-gray-800">
          <TextInput
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            multiline
            maxLength={COPILOT_MAX_MESSAGE_CHARS}
            placeholder={t('businessHome.copilot.placeholder')}
            placeholderTextColor="#6B7280"
            textAlignVertical="top"
            className="max-h-28 py-1.5 font-geist text-[16px] text-ink dark:text-gray-100"
          />
        </View>
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={t('businessHome.copilot.send')}
          accessibilityState={{ disabled: !canSend }}
          className={cn(
            'h-11 w-11 items-center justify-center rounded-full',
            canSend ? 'bg-brand active:opacity-80' : 'bg-disabled',
          )}
        >
          <ArrowUp size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <View className="mt-1.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Text className="font-geist text-[11px] text-gray-500 dark:text-gray-400">
            {t('businessHome.copilot.creditsHint')}
          </Text>
          <Pressable onPress={onOpenHow} accessibilityRole="link" hitSlop={8}>
            <Text className="font-geist-bold text-[11px] text-brand">
              {t('businessHome.copilot.creditsHowLink')}
            </Text>
          </Pressable>
        </View>
        <Text className="font-geist text-[11px] text-gray-400">
          {t('businessHome.copilot.charCounter', {
            count: value.length,
            max: COPILOT_MAX_MESSAGE_CHARS,
          })}
        </Text>
      </View>
      {credits && isShortenedAnswerBudget(credits) ? (
        <Text className="mt-1 font-geist text-[11px] text-gray-500 dark:text-gray-400">
          {t('businessHome.copilot.lowCreditsHint', { count: credits.remaining })}
        </Text>
      ) : null}
    </View>
  );
}
