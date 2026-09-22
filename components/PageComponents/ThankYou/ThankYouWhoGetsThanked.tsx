import { Text, View, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HeartHandshake } from 'lucide-react-native';
import { WhiteBox } from '@/components/ui/WhiteBox';
import type { ThankYouRecipientDAO } from '@/http/business-api/types';

function RecipientRow({ recipient }: { recipient: ThankYouRecipientDAO }) {
  const { t } = useTranslation();

  const actionLabel =
    recipient.action === 'pickedYouMentioned' && recipient.mention
      ? t('thankYou.who.actions.pickedYouMentionedWithText', {
          mention: recipient.mention,
        })
      : t(`thankYou.who.actions.${recipient.action}`);

  const timeLabel =
    recipient.days_ago != null
      ? t('thankYou.who.relative.daysAgo', { count: recipient.days_ago })
      : null;

  const initial = (recipient.name.trim().charAt(0) || '?').toUpperCase();

  return (
    <View className="flex-row items-center gap-3 py-2">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-tint">
        <Text className="font-geist-semibold text-sm text-brand">{initial}</Text>
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          className="font-geist-semibold text-sm text-ink dark:text-gray-100"
          numberOfLines={1}
        >
          {recipient.name}
        </Text>
        <Text
          className="font-geist text-xs leading-4 text-gray-500 dark:text-gray-400"
          numberOfLines={2}
        >
          {actionLabel}
          {timeLabel ? ` · ${timeLabel}` : ''}
        </Text>
      </View>
      <View className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 dark:bg-gray-800">
        <Text className="font-geist-semibold text-xs text-ink dark:text-gray-200">
          {t('thankYou.who.queued')}
        </Text>
      </View>
    </View>
  );
}

interface ThankYouWhoGetsThankedProps {
  recipients: ThankYouRecipientDAO[];
  isLoading?: boolean;
  isError?: boolean;
}

export function ThankYouWhoGetsThanked({
  recipients,
  isLoading = false,
  isError = false,
}: ThankYouWhoGetsThankedProps) {
  const { t } = useTranslation();
  const hasRecipients = recipients.length > 0;

  return (
    <WhiteBox className="gap-3 p-4">
      <Text className="font-geist-extrabold text-base text-ink dark:text-gray-100">
        {t('thankYou.who.title')}
      </Text>

      {isLoading ? (
        <View className="items-center py-4">
          <ActivityIndicator color="#FF6B1A" />
        </View>
      ) : isError ? (
        <Text className="font-geist text-sm leading-5 text-gray-500 dark:text-gray-400">
          {t('thankYou.who.loadError')}
        </Text>
      ) : !hasRecipients ? (
        <View className="items-center gap-2 py-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-tint">
            <HeartHandshake size={24} color="#FF6B1A" />
          </View>
          <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">
            {t('thankYou.who.emptyTitle')}
          </Text>
          <Text className="px-2 text-center font-geist text-xs leading-4 text-gray-500 dark:text-gray-400">
            {t('thankYou.who.empty')}
          </Text>
        </View>
      ) : (
        <View className="gap-0.5">
          {recipients.map((recipient) => (
            <RecipientRow key={recipient.id} recipient={recipient} />
          ))}
        </View>
      )}

      {hasRecipients ? (
        <Text className="font-geist text-sm leading-5 text-gray-500 dark:text-gray-400">
          {t('thankYou.who.footnote')}
        </Text>
      ) : null}
    </WhiteBox>
  );
}
