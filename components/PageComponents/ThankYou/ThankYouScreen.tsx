import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { HeartHandshake } from 'lucide-react-native';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { AppRefreshControl } from '@/components/ui/AppRefreshControl';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { WhiteBox } from '@/components/ui/WhiteBox';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { isBusinessAccountType } from '@/utils/businessAccount';
import {
  useSendThankYouRewards,
  useThankYouEligible,
} from '@/hooks/useThankYouRewards';
import {
  ThankYouConfig,
  type ThankYouConfigValues,
} from './ThankYouConfig';
import { ThankYouPreview } from './ThankYouPreview';
import { ThankYouWhoGetsThanked } from './ThankYouWhoGetsThanked';

export default function ThankYouScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const accountType = useAuthStore((s) => s.accountType ?? s.user?.accountType);
  const businessName = useBusinessStore((s) => s.businessInfo?.name ?? '');
  const businessId = useBusinessStore((s) => s.businessId);
  const hasFetched = useBusinessStore((s) => s.hasFetched);
  const loadBusinessInfo = useBusinessStore((s) => s.loadBusinessInfo);

  const [config, setConfig] = useState<ThankYouConfigValues>({
    preset: 20,
    customPercent: 25,
    validityDays: 30,
  });

  useEffect(() => {
    if (!isBusinessAccountType(accountType ?? undefined)) {
      router.replace('/profile' as never);
    }
  }, [accountType, router]);

  useEffect(() => {
    if (!hasFetched) {
      void loadBusinessInfo();
    }
  }, [hasFetched, loadBusinessInfo]);

  const eligibleQuery = useThankYouEligible(
    isBusinessAccountType(accountType ?? undefined) && Boolean(businessId),
  );
  const sendMutation = useSendThankYouRewards();

  const percent = useMemo(() => {
    if (config.preset === 'custom') return config.customPercent;
    return config.preset;
  }, [config.customPercent, config.preset]);

  const recipients = eligibleQuery.data?.recipients ?? [];
  const eligibleCount = eligibleQuery.data?.count ?? 0;
  const isLoadingEligible = eligibleQuery.isPending;
  const isEmpty =
    !isLoadingEligible && !eligibleQuery.isError && eligibleCount === 0;
  const hasRecipients = !isLoadingEligible && eligibleCount > 0;

  const heroTitle = isLoadingEligible
    ? t('thankYou.heroLoading')
    : t('thankYou.heroTitle', { count: eligibleCount });

  const heroSubtitle = isEmpty
    ? t('thankYou.heroSubtitleEmpty')
    : t('thankYou.heroSubtitle');

  const handleRefresh = useCallback(() => {
    void eligibleQuery.refetch();
  }, [eligibleQuery]);

  const handleSend = useCallback(() => {
    if (eligibleCount === 0 || sendMutation.isPending) return;

    Alert.alert(
      t('thankYou.sendConfirmTitle'),
      t('thankYou.sendConfirmBody', { count: eligibleCount }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('thankYou.send'),
          onPress: () => {
            sendMutation.mutate(
              { percent, validity_days: config.validityDays },
              {
                onSuccess: () => {
                  toast.success(t('thankYou.sendSuccess'));
                },
                onError: (error: Error) => {
                  toast.error(error.message || t('thankYou.sendFailed'));
                },
              },
            );
          },
        },
      ],
    );
  }, [
    config.validityDays,
    eligibleCount,
    percent,
    sendMutation,
    t,
  ]);

  if (!isBusinessAccountType(accountType ?? undefined)) {
    return null;
  }

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader title={t('thankYou.title')} />
      <AppScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-8 pt-2"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          Platform.OS === 'android' ? undefined : (
            <AppRefreshControl
              refreshing={eligibleQuery.isRefetching && !eligibleQuery.isPending}
              onRefresh={handleRefresh}
            />
          )
        }
      >
        <WhiteBox className="gap-3 p-4">
          <View className="flex-row items-start gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-tint">
              <HeartHandshake size={22} color="#FF6B1A" />
            </View>
            <View className="min-w-0 flex-1 gap-1.5">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="min-w-0 flex-shrink font-geist-extrabold text-xl leading-7 text-ink dark:text-gray-100">
                  {heroTitle}
                </Text>
                {hasRecipients ? (
                  <View className="rounded-full bg-brand-tint px-2.5 py-0.5">
                    <Text className="font-geist-semibold text-xs text-brand">
                      {eligibleCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              {!isLoadingEligible ? (
                <Text className="font-geist text-sm leading-5 text-gray-500 dark:text-gray-400">
                  {heroSubtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </WhiteBox>

        <ThankYouConfig
          values={config}
          percent={percent}
          onChange={(next) => setConfig((prev) => ({ ...prev, ...next }))}
        />

        <ThankYouPreview
          percent={percent}
          validityDays={config.validityDays}
          businessName={businessName}
        />

        <ThankYouWhoGetsThanked
          recipients={recipients}
          isLoading={isLoadingEligible}
          isError={eligibleQuery.isError}
        />

        {hasRecipients ? (
          <LocalNotesButton
            label={
              sendMutation.isPending
                ? t('thankYou.sending')
                : t('thankYou.send')
            }
            onPress={handleSend}
            variant="brand"
            disabled={sendMutation.isPending}
            loading={sendMutation.isPending}
          />
        ) : isEmpty ? (
          <Text className="px-1 text-center font-geist text-sm leading-5 text-gray-500 dark:text-gray-400">
            {t('thankYou.sendUnavailable')}
          </Text>
        ) : null}
      </AppScrollView>
    </View>
  );
}
