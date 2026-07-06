import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { BackButton } from '../components/ui/BackButton';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  return (
    <ScrollView
      className="flex-1 bg-page dark:bg-gray-950"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <View style={{ paddingTop: insets.top + 20 }} className="px-6 mb-8">
        <BackButton />
        <Text className="font-geist-bold text-3xl text-ink dark:text-gray-100 mt-6">
          {t('settings.title')}
        </Text>
      </View>

      {/* Appearance */}
      <View className="px-6 mb-6">
        <Text className="font-geist-semibold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
          {t('settings.appearance')}
        </Text>
        <View className="bg-paper dark:bg-gray-900 rounded-2xl px-4">
          <View className="flex-row items-center justify-between py-4">
            <Text className="font-geist-medium text-base text-ink dark:text-gray-100">
              {colorScheme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
            </Text>
            <ThemeToggle />
          </View>
        </View>
      </View>

      {/* Language */}
      <View className="px-6">
        <Text className="font-geist-semibold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">
          {t('settings.language')}
        </Text>
        <View className="bg-paper dark:bg-gray-900 rounded-2xl px-4">
          <View className="flex-row items-center justify-between py-4">
            <Text className="font-geist-medium text-base text-ink dark:text-gray-100">
              {t('settings.currentLanguage')}
            </Text>
            <Text className="font-geist text-base text-gray-400 dark:text-gray-500">
              {t('settings.english')}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
