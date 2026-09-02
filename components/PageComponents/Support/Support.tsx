import { Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import {
  ChevronRight,
  FileText,
  Headphones,
  Mail,
  MapPin,
  Phone,
  Scale,
  Shield,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { PageHeader } from '@/components/ui/PageHeader';
import { SettingsNavRow } from '@/components/PageComponents/Profile/AccountSettings/SettingsNavRow';
import { SettingsSection } from '@/components/PageComponents/Profile/AccountSettings/SettingsSection';

const SUPPORT_PHONE = '+1-602-652-4777';
const SUPPORT_PHONE_HREF = 'tel:+16026524777';
const SUPPORT_EMAIL = 'localnotesapp@gmail.com';
const SUPPORT_ADDRESS = '9001 Antora Summit St, Las Vegas, NV 89166';
const BRAND = '#FF6B1A';

function ContactMethodRow({
  icon: Icon,
  label,
  value,
  onPress,
  isLast = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mutedIcon = isDark ? '#9CA3AF' : '#6B7280';

  const row = (
    <View
      className={`flex-row items-start gap-3 py-3.5 ${
        isLast ? '' : 'border-b border-gray-100 dark:border-gray-800'
      }`}
    >
      <View
        className={`h-9 w-9 items-center justify-center rounded-xl ${
          onPress
            ? 'bg-brand-tint dark:bg-brand/20'
            : 'bg-gray-100 dark:bg-gray-800'
        }`}
      >
        <Icon
          size={17}
          color={onPress ? BRAND : mutedIcon}
          strokeWidth={2.1}
        />
      </View>
      <View className="min-w-0 flex-1 gap-1 pt-0.5">
        <Text className="font-geist-semibold text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </Text>
        <Text
          className={`font-geist-medium text-[14px] leading-5 ${
            onPress
              ? 'text-brand'
              : 'text-ink dark:text-gray-200'
          }`}
        >
          {value}
        </Text>
      </View>
      {onPress ? (
        <ChevronRight
          size={16}
          color={isDark ? '#6B7280' : '#9CA3AF'}
          style={{ marginTop: 10 }}
        />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        className="active:opacity-70"
      >
        {row}
      </Pressable>
    );
  }

  return row;
}

export function Support() {
  const router = useRouter();
  const { t } = useTranslation();

  const openUrl = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader title={t('support.title')} />

      <AppScrollView
        className="flex-1"
        contentContainerClassName="pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="mx-6 mb-6 items-center overflow-hidden rounded-2xl border border-brand/15 bg-brand-tint/60 px-5 py-6 dark:border-brand/25 dark:bg-brand/10">
          <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand shadow-sm">
            <Headphones size={26} color="#FFFFFF" strokeWidth={2.25} />
          </View>
          <Text className="text-center font-geist-bold text-[17px] tracking-tight text-ink dark:text-gray-100">
            {t('support.title')}
          </Text>
          <Text className="mt-2 max-w-[300px] text-center font-geist text-[13px] leading-5 text-gray-600 dark:text-gray-400">
            {t('support.intro')}
          </Text>
        </View>

        <SettingsSection title={t('support.contactSection')}>
          <ContactMethodRow
            icon={Phone}
            label={t('support.phone')}
            value={SUPPORT_PHONE}
            onPress={() => openUrl(SUPPORT_PHONE_HREF)}
          />
          <ContactMethodRow
            icon={Mail}
            label={t('support.email')}
            value={SUPPORT_EMAIL}
            onPress={() => openUrl(`mailto:${SUPPORT_EMAIL}`)}
          />
          <ContactMethodRow
            icon={MapPin}
            label={t('support.address')}
            value={SUPPORT_ADDRESS}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('support.legalSection')}>
          <SettingsNavRow
            icon={Shield}
            title={t('support.privacyPolicy')}
            onPress={() => router.push('/privacy-policy' as Href)}
          />
          <SettingsNavRow
            icon={FileText}
            title={t('support.termsOfService')}
            onPress={() => router.push('/terms' as Href)}
          />
          <SettingsNavRow
            icon={Scale}
            title={t('support.communityGuidelines')}
            onPress={() => router.push('/community-guidelines' as Href)}
            isLast
          />
        </SettingsSection>
      </AppScrollView>
    </View>
  );
}
