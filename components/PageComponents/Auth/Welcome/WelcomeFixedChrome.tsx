import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';

export function WelcomeFixedChrome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const logoTop = Math.max(insets.top + 4, 37);

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      <Text
        accessibilityRole="header"
        accessibilityLabel="LocalNotes"
        className="absolute self-center font-geist-extrabold text-[25px]"
        style={{
          top: logoTop,
          textShadowColor: 'rgba(0,0,0,0.47)',
          textShadowOffset: { width: 1.3, height: 1.3 },
          textShadowRadius: 2,
        }}
      >
        <Text className="text-brand">Local</Text>
        <Text className="text-white">Notes</Text>
      </Text>

      <View
        className="absolute left-0 right-0 px-5"
        style={{ bottom: insets.bottom + 8 }}
        pointerEvents="box-none"
      >
        <View className="mb-6" accessibilityLabel={t('auth.welcome.headlineA11y')}>
          <Text
            className="font-geist-extrabold text-[50px] leading-[54px] text-white"
            maxFontSizeMultiplier={1.15}
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.75}
            style={{
              textShadowColor: 'rgba(0,0,0,0.43)',
              textShadowOffset: { width: 1.3, height: 1.3 },
              textShadowRadius: 3.3,
            }}
          >
            {t('auth.welcome.headlineLine1')}
          </Text>
          <Text
            className="mt-1 font-fraunces text-[45px] leading-[50px] text-brand"
            maxFontSizeMultiplier={1.15}
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.75}
            style={{
              textShadowColor: 'rgba(0,0,0,0.43)',
              textShadowOffset: { width: 1.3, height: 1.3 },
              textShadowRadius: 3.3,
            }}
          >
            {t('auth.welcome.headlineLine2')}
          </Text>
          <Text
            className="mt-6 max-w-[342px] font-geist text-[15px] leading-[22px] text-[#F0ECE8]"
            maxFontSizeMultiplier={1.3}
          >
            {t('auth.welcome.subtitle')}
          </Text>
        </View>

        <View className="gap-[13px]">
          <LocalNotesButton
            label={t('auth.welcome.createAccount')}
            onPress={() => router.push('/sign-up' as Href)}
            variant="brand"
            size="lg"
          />
          <View className="overflow-hidden rounded-xl border border-white/30 bg-[#141416]/75">
            <LocalNotesButton
              label={t('auth.welcome.signIn')}
              onPress={() => router.push('/sign-in' as Href)}
              variant="ghost"
              size="lg"
              textClassName="text-white"
            />
          </View>
        </View>

        <Text
          className="mt-5 text-center font-geist leading-[17px] text-[#B9B6B2]"
          maxFontSizeMultiplier={1.3}
        >
          {t('auth.welcome.legalPrefix')}
          <Text
            className="text-white underline"
            onPress={() => router.push('/terms' as Href)}
            accessibilityRole="link"
          >
            {t('auth.welcome.terms')}
          </Text>
          {t('auth.welcome.legalSeparator')}
          <Text
            className="text-white underline"
            onPress={() => router.push('/privacy-policy' as Href)}
            accessibilityRole="link"
          >
            {t('auth.welcome.privacy')}
          </Text>
          {t('auth.welcome.legalAnd')}
          <Text
            className="text-white underline"
            onPress={() => router.push('/community-guidelines' as Href)}
            accessibilityRole="link"
          >
            {t('auth.welcome.guidelines')}
          </Text>
          {t('auth.welcome.legalSuffix')}
        </Text>
      </View>
    </View>
  );
}
