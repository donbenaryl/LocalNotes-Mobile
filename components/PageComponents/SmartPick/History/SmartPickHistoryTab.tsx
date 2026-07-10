import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react-native';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyScreen } from '@/components/ui/EmptyScreen';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { useSmartPickHistory } from '@/hooks/useSmartPickHistory';
import { SmartPickHistoryRow } from './SmartPickHistoryRow';

export function SmartPickHistoryTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { conversations, isPending, isError, error, refetch } = useSmartPickHistory();

  return (
    <View className="flex-1">
      <PageHeader title={t('smartPick.historyTitle')} />

      <ScrollView contentContainerClassName="gap-2.5 px-4 pb-10 pt-4" showsVerticalScrollIndicator={false}>
        {isPending ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" color="#FF6B1A" />
          </View>
        ) : isError ? (
          <View className="items-center gap-3 py-16">
            <Text className="font-geist text-sm text-red-500">
              {error ?? t('smartPick.historyLoadError')}
            </Text>
            <LocalNotesButton
              label={t('smartPick.tryAgain')}
              onPress={() => void refetch()}
              variant="dark"
              size="sm"
              isWidthFull={false}
            />
          </View>
        ) : conversations.length === 0 ? (
          <EmptyScreen
            icon={<History size={40} color="#D1D5DB" />}
            title={t('smartPick.historyEmptyTitle')}
            description={t('smartPick.historyEmptyDetail')}
            className="py-16"
          />
        ) : (
          conversations.map((conversation) => (
            <SmartPickHistoryRow
              key={conversation.id}
              conversation={conversation}
              onPress={() => router.push(`/(app)/(stack)/smart-pick/${conversation.id}` as never)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
