import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle } from 'react-native-svg';
import { LocalNotesButton } from '../../../ui/LocalNotesButton';

function CheckCircleIcon() {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
      <Circle cx={40} cy={40} r={40} fill="#22C55E" opacity={0.15} />
      <Circle cx={40} cy={40} r={28} fill="#22C55E" />
      <Path
        d="M28 40L36 48L52 32"
        stroke="white"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MainPasswordUpdated() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-white dark:bg-gray-900 px-6 items-center justify-center"
      style={{ paddingBottom: insets.bottom + 24 }}
    >
      <CheckCircleIcon />

      <Text className="font-geist-bold text-3xl text-ink dark:text-gray-100 mt-8 text-center">
        {t('auth.passwordUpdated.title')}
      </Text>
      <Text className="font-geist text-base text-gray-500 dark:text-gray-400 mt-3 text-center px-4">
        {t('auth.passwordUpdated.subtitle')}
      </Text>

      <View className="w-full mt-12">
        <LocalNotesButton
          label={t('auth.passwordUpdated.signIn')}
          onPress={() => router.replace('/(auth)/sign-in' as Href)}
          variant="dark"
        />
      </View>
    </View>
  );
}
