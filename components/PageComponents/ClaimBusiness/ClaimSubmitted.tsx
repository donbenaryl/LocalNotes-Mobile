import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, Check, ClipboardCheck, Store } from 'lucide-react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { PageHeader } from '@/components/ui/PageHeader';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';

const BRAND = '#FF6B1A';
const EASE_OUT = Easing.out(Easing.cubic);

function SuccessMark() {
  const entrance = useSharedValue(0);
  const breath = useSharedValue(0);

  useEffect(() => {
    entrance.value = withTiming(1, { duration: 520, easing: EASE_OUT });
    breath.value = withDelay(
      600,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [breath, entrance]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ scale: 0.88 + entrance.value * 0.12 }],
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + breath.value * 0.25,
    transform: [{ scale: 1 + breath.value * 0.06 }],
  }));

  const midRingStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + breath.value * 0.2,
    transform: [{ scale: 1 + breath.value * 0.03 }],
  }));

  return (
    <View style={styles.markWrap}>
      <Animated.View
        pointerEvents="none"
        style={[styles.ringOuter, outerRingStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.ringMid, midRingStyle]}
      />
      <Animated.View style={[styles.badge, markStyle]}>
        <Check size={34} color="#FFFFFF" strokeWidth={2.75} />
      </Animated.View>
    </View>
  );
}

function NextStepRow({
  icon: Icon,
  label,
  isLast,
}: {
  icon: typeof ClipboardCheck;
  label: string;
  isLast?: boolean;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="items-center">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-tint dark:bg-brand/20">
          <Icon size={14} color={BRAND} strokeWidth={2.25} />
        </View>
        {!isLast ? (
          <View className="my-1 min-h-[14px] w-px flex-1 bg-brand/20 dark:bg-brand/30" />
        ) : null}
      </View>
      <Text
        className={`min-w-0 flex-1 font-geist text-[13px] leading-5 text-gray-600 dark:text-gray-300 ${
          isLast ? 'pb-0' : 'pb-3'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ClaimSubmitted() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        title={t('claimBusiness.submitted.title')}
        hideBack
      />
      {/* Body Section */}
      <View className="flex-1 items-center justify-center px-6">
        <SuccessMark />

        <Animated.View
          entering={FadeInDown.delay(80)
            .duration(480)
            .easing(EASE_OUT)}
          className="w-full items-center"
        >
          <Text className="text-center font-geist-bold text-[22px] tracking-tight text-ink dark:text-gray-100">
            {t('claimBusiness.submitted.title')}
          </Text>
          <Text className="mt-2 max-w-[320px] text-center font-geist text-[14px] leading-6 text-gray-500 dark:text-gray-400">
            {t('claimBusiness.submitted.body')}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200)
            .duration(480)
            .easing(EASE_OUT)}
          className="mt-8 w-full max-w-[340px] overflow-hidden rounded-2xl border border-brand/15 bg-brand-tint/60 px-4 py-4 dark:border-brand/25 dark:bg-brand/10"
        >
          <Text className="mb-3 font-geist-semibold text-[11px] uppercase tracking-wider text-brand dark:text-brand">
            {t('claimBusiness.submitted.nextTitle')}
          </Text>
          <NextStepRow
            icon={ClipboardCheck}
            label={t('claimBusiness.submitted.nextReview')}
          />
          <NextStepRow
            icon={Bell}
            label={t('claimBusiness.submitted.nextNotify')}
          />
          <NextStepRow
            icon={Store}
            label={t('claimBusiness.submitted.nextManage')}
            isLast
          />
        </Animated.View>
      </View>
      <View className="flex flex-row gap-3 px-4 pb-10">
        <LocalNotesButton
          label={t('claimBusiness.submitted.viewClaims')}
          variant="brand"
          onPress={() =>
            router.replace('/(app)/(stack)/claim-business')
          }
          className="flex-1"
        />
        <LocalNotesButton
          label={t('claimBusiness.submitted.done')}
          variant="light"
          onPress={() =>
            router.replace('/(app)/(stack)/profile/account-settings')
          }
          className="flex-1"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  markWrap: {
    width: 148,
    height: 148,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
  },
  ringMid: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255, 107, 26, 0.16)',
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
