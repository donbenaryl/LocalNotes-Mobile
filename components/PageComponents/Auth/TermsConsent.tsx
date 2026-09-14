import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/Checkbox';

interface TermsConsentProps {
  agreed: boolean;
  onChange: (agreed: boolean) => void;
  /** Show the "Required for every new account" badge above the checkbox. */
  showBadge?: boolean;
  className?: string;
}

export function TermsConsent({
  agreed,
  onChange,
  showBadge = false,
  className,
}: TermsConsentProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View className={className}>
      {showBadge ? (
        <Text className="font-geist-semibold text-[11px] tracking-[0.16em] uppercase text-brand-dark mb-2.5">
          {t('auth.consent.badge')}
        </Text>
      ) : null}

      <View className="flex-row gap-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-paper dark:bg-gray-800 p-4">
        <View className="pt-0.5">
          <Checkbox checked={agreed} onChange={onChange} size={26} />
        </View>

        <View className="flex-1">
          <Text className="font-geist-semibold text-[15px] leading-snug text-ink dark:text-gray-100">
            {t('auth.consent.prefix')}
            <Text
              className="font-geist-semibold text-[15px] text-brand underline cursor-pointer"
              onPress={() => router.push('/terms' as Href)}
            >
              {t('auth.consent.terms')}
            </Text>
            {t('auth.consent.separator')}
            <Text
              className="font-geist-semibold text-[15px] text-brand underline cursor-pointer"
              onPress={() => router.push('/privacy-policy' as Href)}
            >
              {t('auth.consent.privacy')}
            </Text>
            {t('auth.consent.andSeparator')}
            <Text
              className="font-geist-semibold text-[15px] text-brand underline cursor-pointer"
              onPress={() => router.push('/community-guidelines' as Href)}
            >
              {t('auth.consent.guidelines')}
            </Text>
            {t('auth.consent.suffix')}
          </Text>
          <Text className="font-geist text-[13px] leading-5 text-gray-500 dark:text-gray-400 mt-2">
            {t('auth.consent.zeroTolerance')}
          </Text>
        </View>
      </View>
    </View>
  );
}
