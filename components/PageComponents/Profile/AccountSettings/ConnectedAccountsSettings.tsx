import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageSectionTitle } from '@/components/ui/PageSectionTitle';
import { ConnectedAccountCard } from './ConnectedAccountCard';
import type { ConnectedProviderId } from './types';
import {
  useConnectGoogleReviews,
  useDisconnectGoogleReviews,
  useReviewConnections,
} from '@/hooks/useProfileReviews';
import { authorizeGoogleReviews } from '@/services/googleReviewsAuth';
import { formatRelativeTime } from '@/utils/time';
import { useToastStore } from '@/stores/useToastStore';

const PROVIDER_ORDER: ConnectedProviderId[] = [
  'google',
  'yelp',
  'amazon',
  'tripadvisor',
];

export default function ConnectedAccountsSettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);
  const { data: connections = [], isPending, refetch } = useReviewConnections();
  const connectMutation = useConnectGoogleReviews();
  const disconnectMutation = useDisconnectGoogleReviews();

  const providers = useMemo(() => {
    const byId = Object.fromEntries(
      connections.map((c) => [c.provider, c]),
    ) as Partial<
      Record<
        ConnectedProviderId,
        (typeof connections)[number]
      >
    >;
    return PROVIDER_ORDER.map((id) => {
      const row = byId[id];
      return {
        id,
        connected: row?.connected ?? false,
        reviewCount: row?.review_count ?? undefined,
        lastSyncedAt: row?.last_synced_at ?? undefined,
        syncStatus: row?.sync_status ?? undefined,
        comingSoon: row?.coming_soon ?? id !== 'google',
      };
    });
  }, [connections]);

  const connected = providers.filter((p) => p.connected);
  const available = providers.filter((p) => !p.connected);

  const getSubtitle = useCallback(
    (id: ConnectedProviderId, connectedFlag: boolean) => {
      const provider = providers.find((p) => p.id === id);
      if (provider?.comingSoon) {
        return t(`accountSettings.connectedAccounts.${id}Hint`);
      }
      if (
        connectedFlag &&
        provider?.reviewCount != null &&
        provider.lastSyncedAt
      ) {
        return t('accountSettings.connectedAccounts.reviewsSynced', {
          count: provider.reviewCount,
          time: formatRelativeTime(provider.lastSyncedAt),
        });
      }
      if (connectedFlag && provider?.syncStatus === 'syncing') {
        return t('profile.reviews.syncing');
      }
      switch (id) {
        case 'amazon':
          return t('accountSettings.connectedAccounts.amazonHint');
        case 'tripadvisor':
          return t('accountSettings.connectedAccounts.tripadvisorHint');
        case 'google':
          return t('accountSettings.connectedAccounts.googleHint');
        case 'yelp':
          return t('accountSettings.connectedAccounts.yelpHint');
        default:
          return '';
      }
    },
    [providers, t],
  );

  const handleGooglePress = useCallback(async () => {
    const google = providers.find((p) => p.id === 'google');
    if (!google || google.comingSoon) return;

    if (google.connected) {
      try {
        await disconnectMutation.mutateAsync();
        showToast({
          type: 'success',
          message: t('accountSettings.connectedAccounts.disconnect'),
        });
        void refetch();
      } catch {
        showToast({
          type: 'error',
          message: t('accountSettings.connectedAccounts.disconnectError'),
        });
      }
      return;
    }

    try {
      const auth = await authorizeGoogleReviews();
      await connectMutation.mutateAsync({
        code: auth.code,
        code_verifier: auth.codeVerifier,
        redirect_uri: auth.redirectUri,
      });
      showToast({
        type: 'success',
        message: t('accountSettings.connectedAccounts.connect'),
      });
      void refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? '');
      if (
        message.toLowerCase().includes('cancel') ||
        message.toLowerCase().includes('dismiss')
      ) {
        showToast({
          type: 'info',
          message: t('accountSettings.connectedAccounts.connectCancelled'),
        });
        return;
      }
      showToast({
        type: 'error',
        message: t('accountSettings.connectedAccounts.connectError'),
      });
    }
  }, [
    connectMutation,
    disconnectMutation,
    providers,
    refetch,
    showToast,
    t,
  ]);

  const handlePress = useCallback(
    (id: ConnectedProviderId) => {
      if (id === 'google') {
        void handleGooglePress();
      }
    },
    [handleGooglePress],
  );

  const busyProvider: ConnectedProviderId | null = connectMutation.isPending
    ? 'google'
    : disconnectMutation.isPending
      ? 'google'
      : null;

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        title={t('accountSettings.connectedAccounts.title')}
        onBack={() => router.back()}
      />
      <AppScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pb-10 pt-4"
      >
        <Text className="mb-4 font-geist text-[13px] leading-[1.5] text-gray-600 dark:text-gray-400">
          {t('accountSettings.connectedAccounts.intro')}
        </Text>

        {isPending ? (
          <View className="items-center py-10">
            <ActivityIndicator color="#FF6B1A" />
          </View>
        ) : (
          <>
            {connected.length > 0 ? (
              <View className="mb-4">
                <PageSectionTitle className="mb-2">
                  {t('accountSettings.connectedAccounts.connectedSection', {
                    count: connected.length,
                  })}
                </PageSectionTitle>
                {connected.map((provider) => (
                  <ConnectedAccountCard
                    key={provider.id}
                    providerId={provider.id}
                    connected
                    subtitle={getSubtitle(provider.id, true)}
                    onPress={() => handlePress(provider.id)}
                    comingSoon={provider.comingSoon}
                    isLoading={busyProvider === provider.id}
                  />
                ))}
              </View>
            ) : null}

            {available.length > 0 ? (
              <View className="mb-4">
                <PageSectionTitle className="mb-2">
                  {t('accountSettings.connectedAccounts.availableSection')}
                </PageSectionTitle>
                {available.map((provider) => (
                  <ConnectedAccountCard
                    key={provider.id}
                    providerId={provider.id}
                    connected={false}
                    subtitle={getSubtitle(provider.id, false)}
                    onPress={() => handlePress(provider.id)}
                    comingSoon={provider.comingSoon}
                    isLoading={busyProvider === provider.id}
                  />
                ))}
              </View>
            ) : null}
          </>
        )}

        <View className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 dark:border-gray-800 dark:bg-gray-800/50">
          <Text className="font-geist text-[11.5px] leading-[1.5] text-gray-600 dark:text-gray-400">
            <Text className="font-geist-bold text-ink dark:text-gray-100">
              {t('accountSettings.connectedAccounts.howItWorksTitle')}{' '}
            </Text>
            {t('accountSettings.connectedAccounts.howItWorksBody')}
          </Text>
        </View>
      </AppScrollView>
    </View>
  );
}
