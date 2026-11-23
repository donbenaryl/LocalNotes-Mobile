import { useCallback, useEffect } from 'react';
import { BackHandler, Image, Linking, Platform, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUpFromLine } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { LocalNotesText } from '@/components/ui/LocalNotesText';
import { BRAND } from '@/constants/colors';
import { useToastStore } from '@/stores/useToastStore';
import {
  getCachedForceUpdateStoreUrl,
  setForceUpdateScreenActive,
} from '@/utils/appVersionGate';
import { WELCOME_GRADIENT_OVERLAY } from '@/constants/welcomeScreens';

const FORCE_UPDATE_BG = require('@/assets/welcome/backgrounds/screen3_bg.jpg');

export function ForceUpdateScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const showToast = useToastStore((s) => s.show);
  const ctaIconColor = colorScheme === 'dark' ? BRAND : '#FFFFFF';

  useEffect(() => {
    setForceUpdateScreenActive(true);
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => {
      setForceUpdateScreenActive(false);
      sub.remove();
    };
  }, []);

  const onUpdate = useCallback(async () => {
    const url = getCachedForceUpdateStoreUrl();
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        showToast({ type: 'error', message: t('forceUpdate.openStoreError') });
        return;
      }
      await Linking.openURL(url);
    } catch {
      showToast({ type: 'error', message: t('forceUpdate.openStoreError') });
    }
  }, [showToast, t]);

  const storeHint =
    Platform.OS === 'android'
      ? t('forceUpdate.storeHintAndroid')
      : t('forceUpdate.storeHintIos');

  return (
    <View className="flex-1 bg-ink">
      <Image
        source={FORCE_UPDATE_BG}
        className="absolute inset-0 h-full w-full"
        resizeMode="cover"
      />
      <Image
        source={WELCOME_GRADIENT_OVERLAY}
        className="absolute inset-0 h-full w-full"
        resizeMode="stretch"
      />
      <LinearGradient
        colors={['rgba(20,20,19,0.35)', 'transparent', 'rgba(20,20,19,0.75)']}
        locations={[0, 0.4, 1]}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        pointerEvents="none"
      />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 px-8 pb-4 pt-6">
          <View className="items-center">
            <LocalNotesText size="xl" variant="brandOnDark" />
          </View>

          <View className="flex-1 items-center justify-center">
            <Text className="mb-4 font-geist-bold uppercase tracking-[0.18em] text-gray-100">
              {t('forceUpdate.eyebrow')}
            </Text>
            <Text className="mb-3 text-center font-madimi text-4xl leading-tight text-white">
              {t('forceUpdate.title')}
            </Text>
            <Text className="max-w-[320px] text-center font-geist text-lg leading-tight text-white/90">
              {t('forceUpdate.message')}
            </Text>
          </View>

          <View className="w-full gap-3">
            <LocalNotesButton
              label={t('forceUpdate.updateCta')}
              onPress={onUpdate}
              variant="brand"
              size="lg"
              isWidthFull
              leftIcon={
                <ArrowUpFromLine size={18} color={ctaIconColor} strokeWidth={2} />
              }
            />
            <Text className="text-center font-geist text-sm text-white/70">
              {storeHint}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
