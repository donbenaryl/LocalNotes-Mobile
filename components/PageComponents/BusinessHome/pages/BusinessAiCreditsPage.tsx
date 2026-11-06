import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAiCreditsDetail } from '@/hooks/useAiCreditsDetail';
import { useOpenBusinessInsightsOnWeb } from '@/hooks/useOpenBusinessInsightsOnWeb';
import { useSelectedBranch } from '@/hooks/useSelectedBranch';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  canAskCopilot,
  dailyBarDetail,
  dailyBarLabels,
  dailyBarValues,
  historyMonthLabel,
} from '@/utils/aiCredits';
import { isBusinessAccountType } from '@/utils/businessAccount';
import { COPILOT_ROUTE } from '@/utils/copilotRoutes';
import { AiCreditsBreakdown } from '../ui/AiCreditsBreakdown';
import { AiCreditsHero } from '../ui/AiCreditsHero';
import { AiCreditsHowItWorksSheet } from '../ui/AiCreditsHowItWorksSheet';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { InsightsBars } from '../ui/InsightsBars';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

const HOW_IT_WORKS = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'] as const;

/** The "AI credits" usage page for the selected branch. No purchase or top-up anywhere. */
export default function BusinessAiCreditsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const accountType = useAuthStore((s) => s.accountType ?? s.user?.accountType);
  const { branchName, isPaid } = useSelectedBranch();
  const openUpgrade = useOpenBusinessInsightsOnWeb();
  const query = useAiCreditsDetail();
  const [howOpen, setHowOpen] = useState(false);
  const isBusiness = isBusinessAccountType(accountType ?? undefined);

  useEffect(() => {
    if (!isBusiness) router.replace('/profile' as never);
  }, [isBusiness, router]);

  if (!isBusiness) return null;

  const title = t('businessHome.aiCredits.page.title', { branchName });
  const detail = query.data;

  let body: React.ReactNode;
  if (!isPaid) {
    body = (
      <BusinessHomeCard variant="upsell" className="mt-4">
        <Text className="font-geist-extrabold text-base text-ink dark:text-gray-100">
          {t('businessHome.aiCredits.page.notEntitledBranch', { branchName })}
        </Text>
        <Text className="mt-2 font-geist text-[13px] leading-[1.55] text-gray-600 dark:text-gray-400">
          {t('businessHome.aiCredits.page.notEntitledBody')}
        </Text>
        <View className="mt-3">
          <LocalNotesButton
            label={t('businessHome.aiCredits.page.upgradeCta')}
            onPress={() => void openUpgrade()}
            variant="dark"
            size="sm"
          />
        </View>
      </BusinessHomeCard>
    );
  } else if (query.isPending) {
    body = (
      <View className="mt-4 gap-3 px-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </View>
    );
  } else if (!detail) {
    body = (
      <View className="items-center gap-3 px-6 py-10">
        <Text className="text-center font-geist text-sm text-gray-600 dark:text-gray-400">
          {t('businessHome.aiCredits.page.error')}
        </Text>
        <LocalNotesButton
          label={t('businessHome.aiCredits.page.retry')}
          onPress={() => void query.refetch()}
          variant="light"
          size="xs"
          isWidthFull={false}
        />
      </View>
    );
  } else {
    const asking = canAskCopilot(detail);
    body = (
      <View className="mt-4">
        <AiCreditsHero credits={detail} />
        <AiCreditsBreakdown detail={detail} />

        {detail.daily.length > 0 ? (
          <BusinessHomeCard className="mt-3">
            <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
              {t('businessHome.aiCredits.page.thisMonthByDay')}
            </Text>
            <InsightsBars
              className="mt-3"
              values={dailyBarValues(detail.daily)}
              labels={dailyBarLabels(detail.daily)}
              height={72}
              formatDetail={(index) => dailyBarDetail(detail.daily, index, t, i18n.language)}
              accessibilityLabel={t('businessHome.aiCredits.page.thisMonthByDay')}
            />
          </BusinessHomeCard>
        ) : null}

        {detail.history.length > 0 ? (
          <BusinessHomeCard className="mt-3">
            <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
              {t('businessHome.aiCredits.page.previousMonths')}
            </Text>
            {detail.history.map((row) => (
              <Text
                key={row.period_start}
                className="py-1 font-geist text-[13px] text-gray-600 dark:text-gray-400"
              >
                {t('businessHome.aiCredits.page.monthRow', {
                  month: historyMonthLabel(row.period_start, i18n.language),
                  used: row.used,
                  allowance: row.allowance,
                })}
              </Text>
            ))}
          </BusinessHomeCard>
        ) : null}

        <BusinessHomeCard className="mt-3">
          <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
            {t('businessHome.aiCredits.page.howItWorksTitle')}
          </Text>
          {HOW_IT_WORKS.map((id) => (
            <Text
              key={id}
              className="mt-1.5 font-geist text-[13px] leading-[1.55] text-gray-600 dark:text-gray-400"
            >
              {`• ${t(`businessHome.aiCredits.page.howItWorks.${id}`, { allowance: detail.allowance })}`}
            </Text>
          ))}
          <Text
            onPress={() => setHowOpen(true)}
            accessibilityRole="link"
            className="mt-3 font-geist-bold text-sm text-brand"
          >
            {t('businessHome.aiCredits.page.seeCalculation')}
          </Text>
        </BusinessHomeCard>

        <View className="mx-4 mt-4">
          <LocalNotesButton
            label={t('businessHome.aiCredits.page.askCopilot')}
            onPress={() => router.push(COPILOT_ROUTE as never)}
            variant="dark"
            size="sm"
            disabled={!asking}
          />
          {!asking ? (
            <Text className="mt-2 text-center font-geist text-xs text-gray-500 dark:text-gray-400">
              {t('businessHome.aiCredits.page.exhausted', { allowance: detail.allowance })}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <BusinessHomeDetailShell
      title={title}
      onBack={() => router.back()}
      refreshing={query.isRefetching}
      onRefresh={isPaid ? () => void query.refetch() : undefined}
    >
      {body}
      <AiCreditsHowItWorksSheet
        visible={howOpen}
        onClose={() => setHowOpen(false)}
        pricing={detail?.pricing}
      />
    </BusinessHomeDetailShell>
  );
}
