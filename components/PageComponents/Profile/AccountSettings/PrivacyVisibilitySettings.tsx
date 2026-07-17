import { useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui/PageHeader';
import accountService from '@/http/account-api/account.services';
import { useAccountSettingsStore } from '@/stores/useAccountSettingsStore';
import { SettingsNavRow } from './SettingsNavRow';
import { SettingsSection } from './SettingsSection';
import { SettingsSwitchRow } from './SettingsSwitchRow';
import type { PrivacyPrefs } from './types';

export default function PrivacyVisibilitySettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const privacy = useAccountSettingsStore((s) => s.privacy);
  const setPrivacy = useAccountSettingsStore((s) => s.setPrivacy);
  const loadPrefs = useAccountSettingsStore((s) => s.loadPrefs);
  const hydrated = useAccountSettingsStore((s) => s.hydrated);
  const privacyLoadError = useAccountSettingsStore((s) => s.privacyLoadError);

  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await accountService.fetchUser();
      return response.data?.data ?? null;
    },
  });

  const toggle = (key: keyof PrivacyPrefs) => (value: boolean) => {
    setPrivacy(key, value);
  };

  const homeCitySub = profile?.location?.city
    ? t('accountSettings.privacy.showHomeCitySub', {
        city: profile.location.city,
      })
    : t('accountSettings.privacy.showHomeCitySubFallback');

  const personalitySub = profile?.personality_name
    ? t('accountSettings.privacy.showPersonalitySub', {
        name: profile.personality_name,
      })
    : t('accountSettings.privacy.showPersonalitySubFallback');

  const handleComingSoon = () => {
    Alert.alert(t('accountSettings.menu.comingSoon'));
  };

  if (!hydrated) {
    return (
      <View className="flex-1 bg-page dark:bg-gray-900">
        <PageHeader
          title={t('accountSettings.privacy.title')}
          onBack={() => router.back()}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        title={t('accountSettings.privacy.title')}
        onBack={() => router.back()}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pb-10 pt-4"
      >
        {privacyLoadError ? (
          <Text className="mb-4 font-geist text-[12px] text-red-500 dark:text-red-400">
            {t('accountSettings.privacy.loadError')}
          </Text>
        ) : null}

        <SettingsSection title={t('accountSettings.privacy.sections.profile')}>
          <SettingsSwitchRow
            title={t('accountSettings.privacy.showHomeCity')}
            subtitle={homeCitySub}
            value={privacy.showHomeCity}
            onValueChange={toggle('showHomeCity')}
          />
          <SettingsSwitchRow
            title={t('accountSettings.privacy.showPersonality')}
            subtitle={personalitySub}
            value={privacy.showPersonality}
            onValueChange={toggle('showPersonality')}
            isLast
          />
        </SettingsSection>

        <SettingsSection
          title={t('accountSettings.privacy.sections.discovery')}
        >
          <SettingsSwitchRow
            title={t('accountSettings.privacy.appearInSearch')}
            subtitle={t('accountSettings.privacy.appearInSearchSub')}
            value={privacy.appearInSearch}
            onValueChange={toggle('appearInSearch')}
          />
          <SettingsSwitchRow
            title={t('accountSettings.privacy.showInSmartPicks')}
            subtitle={t('accountSettings.privacy.showInSmartPicksSub')}
            value={privacy.showInSmartPicks}
            onValueChange={toggle('showInSmartPicks')}
          />
          <SettingsSwitchRow
            title={t('accountSettings.privacy.allowMentions')}
            subtitle={t('accountSettings.privacy.allowMentionsSub')}
            value={privacy.allowMentionsFromAnyone}
            onValueChange={toggle('allowMentionsFromAnyone')}
          />
          <SettingsSwitchRow
            title={t('accountSettings.privacy.showSavedList')}
            subtitle={t('accountSettings.privacy.showSavedListSub')}
            value={privacy.showSavedList}
            onValueChange={toggle('showSavedList')}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('accountSettings.privacy.sections.location')}>
          <SettingsSwitchRow
            title={t('accountSettings.privacy.usePreciseLocation')}
            subtitle={t('accountSettings.privacy.usePreciseLocationSub')}
            value={privacy.usePreciseLocation}
            onValueChange={toggle('usePreciseLocation')}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('accountSettings.privacy.sections.blocked')}>
          <SettingsNavRow
            title={t('accountSettings.privacy.blockedUsers')}
            subtitle={t('accountSettings.privacy.blockedUsersSub')}
            value="0"
            onPress={handleComingSoon}
          />
          <SettingsNavRow
            title={t('accountSettings.privacy.hiddenLists')}
            subtitle={t('accountSettings.privacy.hiddenListsSub')}
            value="0"
            onPress={handleComingSoon}
            isLast
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}
