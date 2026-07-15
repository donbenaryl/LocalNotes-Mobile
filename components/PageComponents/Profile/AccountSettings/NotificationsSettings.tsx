import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAccountSettingsStore } from '@/stores/useAccountSettingsStore';
import { SettingsSection } from './SettingsSection';
import { SettingsSwitchRow } from './SettingsSwitchRow';
import type { NotificationPrefs } from './types';

export default function NotificationsSettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const notifications = useAccountSettingsStore((s) => s.notifications);
  const setNotification = useAccountSettingsStore((s) => s.setNotification);
  const loadPrefs = useAccountSettingsStore((s) => s.loadPrefs);

  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  const toggle =
    (key: keyof NotificationPrefs) => (value: boolean) => {
      setNotification(key, value);
    };

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        title={t('accountSettings.notifications.title')}
        onBack={() => router.back()}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pb-10 pt-4"
      >
        <Text className="mb-5 font-fraunces text-[12.5px] italic leading-[1.5] text-gray-600 dark:text-gray-400">
          {t('accountSettings.notifications.intro')}
        </Text>

        <SettingsSection
          title={t('accountSettings.notifications.sections.activity')}
        >
          <SettingsSwitchRow
            title={t('accountSettings.notifications.likesAndSaves')}
            subtitle={t('accountSettings.notifications.likesAndSavesSub')}
            value={notifications.likesAndSaves}
            onValueChange={toggle('likesAndSaves')}
          />
          <SettingsSwitchRow
            title={t('accountSettings.notifications.newFollowers')}
            value={notifications.newFollowers}
            onValueChange={toggle('newFollowers')}
          />
          <SettingsSwitchRow
            title={t('accountSettings.notifications.mentions')}
            subtitle={t('accountSettings.notifications.mentionsSub')}
            value={notifications.mentions}
            onValueChange={toggle('mentions')}
          />
          <SettingsSwitchRow
            title={t('accountSettings.notifications.commentsAndReplies')}
            value={notifications.commentsAndReplies}
            onValueChange={toggle('commentsAndReplies')}
            isLast
          />
        </SettingsSection>

        <SettingsSection
          title={t('accountSettings.notifications.sections.fromFollows')}
        >
          <SettingsSwitchRow
            title={t('accountSettings.notifications.newLists')}
            value={notifications.newLists}
            onValueChange={toggle('newLists')}
          />
          <SettingsSwitchRow
            title={t('accountSettings.notifications.newPicks')}
            subtitle={t('accountSettings.notifications.newPicksSub')}
            value={notifications.newPicks}
            onValueChange={toggle('newPicks')}
            isLast
          />
        </SettingsSection>

        <SettingsSection
          title={t('accountSettings.notifications.sections.businessOffers')}
        >
          <SettingsSwitchRow
            title={t('accountSettings.notifications.businessOffers')}
            value={notifications.businessOffers}
            onValueChange={toggle('businessOffers')}
          />
          <SettingsSwitchRow
            title={t('accountSettings.notifications.featuredOffers')}
            subtitle={t('accountSettings.notifications.featuredOffersSub')}
            value={notifications.featuredOffers}
            onValueChange={toggle('featuredOffers')}
            isLast
          />
        </SettingsSection>

        <SettingsSection
          title={t('accountSettings.notifications.sections.emailDigests')}
        >
          <SettingsSwitchRow
            title={t('accountSettings.notifications.weeklyRecap')}
            subtitle={t('accountSettings.notifications.weeklyRecapSub')}
            value={notifications.weeklyRecap}
            onValueChange={toggle('weeklyRecap')}
          />
          <SettingsSwitchRow
            title={t('accountSettings.notifications.reengagementNudges')}
            subtitle={t('accountSettings.notifications.reengagementNudgesSub')}
            value={notifications.reengagementNudges}
            onValueChange={toggle('reengagementNudges')}
            isLast
          />
        </SettingsSection>

        <SettingsSection
          title={t('accountSettings.notifications.sections.quietHours')}
        >
          <SettingsSwitchRow
            title={t('accountSettings.notifications.quietHours')}
            subtitle={t('accountSettings.notifications.quietHoursSub')}
            value={notifications.quietHours}
            onValueChange={toggle('quietHours')}
            isLast
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}
