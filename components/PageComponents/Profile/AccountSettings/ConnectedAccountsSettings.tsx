import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAccountSettingsStore } from '@/stores/useAccountSettingsStore';
import { ConnectedAccountCard } from './ConnectedAccountCard';
import type { ConnectedProviderId } from './types';
import { PageSectionTitle } from '@/components/ui/PageSectionTitle';

export default function ConnectedAccountsSettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const providers = useAccountSettingsStore((s) => s.connectedProviders);
  const toggleConnectedProvider = useAccountSettingsStore(
    (s) => s.toggleConnectedProvider,
  );
  const loadPrefs = useAccountSettingsStore((s) => s.loadPrefs);

  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  const connected = providers.filter((p) => p.connected);
  const available = providers.filter((p) => !p.connected);

  const getSubtitle = (id: ConnectedProviderId, connectedFlag: boolean) => {
    const provider = providers.find((p) => p.id === id);
    if (connectedFlag && provider?.reviewCount != null && provider.lastSyncedAt) {
      return t('accountSettings.connectedAccounts.reviewsSynced', {
        count: provider.reviewCount,
        time: provider.lastSyncedAt,
      });
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
  };

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        title={t('accountSettings.connectedAccounts.title')}
        onBack={() => router.back()}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pb-10 pt-4"
      >
        <Text className="mb-4 font-geist text-[13px] leading-[1.5] text-gray-600 dark:text-gray-400">
          {t('accountSettings.connectedAccounts.intro')}
        </Text>

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
                onPress={() => toggleConnectedProvider(provider.id)}
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
                onPress={() => toggleConnectedProvider(provider.id)}
              />
            ))}
          </View>
        ) : null}

        <View className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 dark:border-gray-800 dark:bg-gray-800/50">
          <Text className="font-geist text-[11.5px] leading-[1.5] text-gray-600 dark:text-gray-400">
            <Text className="font-geist-bold text-ink dark:text-gray-100">
              {t('accountSettings.connectedAccounts.howItWorksTitle')}{' '}
            </Text>
            {t('accountSettings.connectedAccounts.howItWorksBody')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
