import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { useSmartPickSession } from '@/hooks/useSmartPickSession';
import { SmartPickResults } from './Result/SmartPickResults';

interface SmartPickSessionTabProps {
  sessionId: string;
}

/**
 * Read-only view of one past Smart Pick session, opened from "Previous picks".
 * No separate page header — SmartPickResults' own summary bar already has a
 * back chevron and shows the session's occasion/time/engine as context, so a
 * second header on top of it would just be a redundant back button.
 */
export function SmartPickSessionTab({ sessionId }: SmartPickSessionTabProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { conversation, isPending, isError, error, refetch } = useSmartPickSession(sessionId);

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B1A" />
        </View>
      ) : isError || !conversation ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="font-geist text-sm text-red-500">
            {error ?? t('smartPick.sessionLoadError')}
          </Text>
          <LocalNotesButton
            label={t('smartPick.tryAgain')}
            onPress={() => void refetch()}
            variant="dark"
            size="sm"
            isWidthFull={false}
          />
        </View>
      ) : (
        <ScrollView contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
          <SmartPickResults conversation={conversation} onBack={() => router.back()} />
        </ScrollView>
      )}
    </View>
  );
}
