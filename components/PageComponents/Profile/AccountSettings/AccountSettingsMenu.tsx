import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import {
  Bell,
  Building2,
  CircleHelp,
  FileText,
  Globe,
  Info,
  Link2,
  LogOut,
  MapPin,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  User,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui/PageHeader';
import accountService from '@/http/account-api/account.services';
import { useAccountSettingsStore } from '@/stores/useAccountSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { AccountSettingsCard } from './AccountSettingsCard';
import { DeleteAccountModal } from './DeleteAccountModal';
import { SettingsNavRow } from './SettingsNavRow';
import { SettingsSection } from './SettingsSection';

export default function AccountSettingsMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const locale = useLocaleStore((s) => s.locale);
  const loadPrefs = useAccountSettingsStore((s) => s.loadPrefs);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

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

  const appVersion =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0';

  const appearanceValue =
    theme === 'dark'
      ? t('accountSettings.menu.appearanceDark')
      : t('accountSettings.menu.appearanceLight');

  const languageValue =
    locale === 'en' ? t('settings.english') : locale.toUpperCase();

  const homeCity = profile?.location?.city ?? '—';
  const personalityValue = profile?.personality_name ?? undefined;
  const connectedSummary = useAccountSettingsStore((s) =>
    s.connectedProviders
      .filter((p) => p.connected)
      .map((p) => {
        if (p.id === 'google') return 'Google';
        if (p.id === 'yelp') return 'Yelp';
        if (p.id === 'amazon') return 'Amazon';
        return 'TripAdvisor';
      })
      .join(', '),
  );

  const goEditProfile = () => {
    router.push('/(app)/(stack)/edit-profile');
  };

  const handleSignOut = async () => {
    queryClient.removeQueries({ queryKey: ['profile'] });
    await clearAuth();
    router.replace('/sign-in');
  };

  const handleToggleAppearance = () => {
    void setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleConfirmDeleteAccount = () => {
    // API not available yet — confirm shell only
    setDeleteModalVisible(false);
  };

  const handleComingSoon = () => {
    Alert.alert(t('accountSettings.menu.comingSoon'));
  };

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        title={t('accountSettings.title')}
        onBack={() => router.back()}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pb-10 pt-4"
      >
        {profile ? <AccountSettingsCard profile={profile} /> : null}

        <SettingsSection title={t('accountSettings.sections.account')}>
          <SettingsNavRow
            icon={User}
            title={t('accountSettings.menu.editProfile')}
            subtitle={t('accountSettings.menu.editProfileSub')}
            onPress={goEditProfile}
          />
          <SettingsNavRow
            icon={Sparkles}
            title={t('accountSettings.menu.personality')}
            subtitle={t('accountSettings.menu.personalitySub')}
            value={personalityValue}
            onPress={() =>
              router.push({
                pathname: '/personality',
                params: { isRetake: 'true' },
              })
            }
          />
          <SettingsNavRow
            icon={MapPin}
            title={t('accountSettings.menu.homeCity')}
            subtitle={t('accountSettings.menu.homeCitySub')}
            value={homeCity}
            onPress={goEditProfile}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('accountSettings.sections.privacyVisibility')}>
          <SettingsNavRow
            icon={Shield}
            title={t('accountSettings.menu.privacyVisibility')}
            subtitle={t('accountSettings.menu.privacyVisibilitySub')}
            onPress={() =>
              router.push(
                '/(app)/(stack)/profile/account-settings/privacy-visibility',
              )
            }
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('accountSettings.sections.preferences')}>
          <SettingsNavRow
            icon={Bell}
            title={t('accountSettings.menu.notifications')}
            onPress={() =>
              router.push(
                '/(app)/(stack)/profile/account-settings/notifications',
              )
            }
          />
          <SettingsNavRow
            icon={Globe}
            title={t('accountSettings.menu.language')}
            value={languageValue}
            showChevron={false}
          />
          <SettingsNavRow
            icon={theme === 'dark' ? Sun : Moon}
            title={t('accountSettings.menu.appearance')}
            value={appearanceValue}
            onPress={handleToggleAppearance}
            showChevron={false}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('accountSettings.sections.connected')}>
          <SettingsNavRow
            icon={Link2}
            title={t('accountSettings.menu.connectedAccounts')}
            value={connectedSummary || undefined}
            onPress={() =>
              router.push(
                '/(app)/(stack)/profile/account-settings/connected-accounts',
              )
            }
          />
          <SettingsNavRow
            icon={Building2}
            title={t('accountSettings.menu.claimBusiness')}
            subtitle={t('accountSettings.menu.claimBusinessSub')}
            onPress={handleComingSoon}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('accountSettings.sections.helpLegal')}>
          <SettingsNavRow
            icon={CircleHelp}
            title={t('accountSettings.menu.helpSupport')}
            onPress={handleComingSoon}
          />
          <SettingsNavRow
            icon={FileText}
            title={t('accountSettings.menu.termsPrivacy')}
            onPress={() => router.push('/privacy-policy')}
          />
          <SettingsNavRow
            icon={Info}
            title={t('accountSettings.menu.about')}
            value={`v${appVersion}`}
            showChevron={false}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('accountSettings.sections.dangerZone')}>
          <SettingsNavRow
            icon={LogOut}
            title={t('accountSettings.menu.signOut')}
            onPress={() => void handleSignOut()}
          />
          <SettingsNavRow
            icon={Trash2}
            title={t('accountSettings.menu.deleteAccount')}
            subtitle={t('accountSettings.menu.deleteAccountSub')}
            danger
            onPress={() => setDeleteModalVisible(true)}
            isLast
          />
        </SettingsSection>
      </ScrollView>

      <DeleteAccountModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleConfirmDeleteAccount}
      />
    </View>
  );
}
