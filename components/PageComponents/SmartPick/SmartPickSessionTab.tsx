import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { AppRefreshControl } from '@/components/ui/AppRefreshControl';
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
  const { conversation, isPending, isError, isRefetching, error, refetch } =
    useSmartPickSession(sessionId);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} className="bg-page dark:bg-dk-page">
      {isPending ? (
        <View style={styles.fill} className="items-center justify-center">
          <ActivityIndicator size="large" color="#1A1714" />
        </View>
      ) : isError || !conversation ? (
        <View style={styles.fill} className="items-center justify-center gap-3 px-6">
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
        <AppScrollView
          style={styles.fill}
          contentContainerClassName="pb-10"
          showsVerticalScrollIndicator={false}
          // RefreshControl blanks flex ScrollViews on Android.
          refreshControl={
            Platform.OS === 'android' ? undefined : (
              <AppRefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
              />
            )
          }
        >
          <SmartPickResults
            conversation={conversation}
            onBack={() => router.back()}
            coordinates={null}
          />
        </AppScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
});
