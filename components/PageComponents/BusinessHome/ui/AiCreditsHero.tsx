import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProgressBar, type ProgressBarTone } from '@/components/ui/ProgressBar';
import type { AiCreditsDAO } from '@/http/business-api/types';
import { levelOf, resetLabel, type CreditsLevel } from '@/utils/aiCredits';
import { BusinessHomeCard } from './BusinessHomeCard';

interface AiCreditsHeroProps {
  credits: AiCreditsDAO;
  now?: Date;
}

const TONE: Record<CreditsLevel, ProgressBarTone> = {
  normal: 'brand',
  warning: 'warning',
  empty: 'danger',
};

/** Credits left, bar, the reset date with its countdown, and the no-rollover note. */
export function AiCreditsHero({ credits, now = new Date() }: AiCreditsHeroProps) {
  const { t, i18n } = useTranslation();
  const level = levelOf(credits);
  const reset = resetLabel(credits.resets_at, now, t, i18n.language);

  return (
    <BusinessHomeCard>
      <Text className="font-geist-extrabold text-5xl text-ink dark:text-gray-100">
        {credits.remaining}
      </Text>
      <Text className="font-geist-semibold text-sm text-gray-600 dark:text-gray-400">
        {t('businessHome.aiCredits.page.left', { count: credits.remaining })}
      </Text>
      <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
        {t('businessHome.aiCredits.page.ofAllowance', { allowance: credits.allowance })}
      </Text>
      <ProgressBar
        className="mt-3"
        percent={credits.percent}
        tone={TONE[level]}
        accessibilityLabel={t('businessHome.aiCredits.page.ofAllowance', {
          allowance: credits.allowance,
        })}
      />
      <View className="mt-3">
        <Text className="font-geist-semibold text-[13px] text-ink dark:text-gray-100">
          {t('businessHome.aiCredits.page.resetsOn', { date: reset.date })}
        </Text>
        <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
          {reset.countdown}
        </Text>
        <Text className="mt-1 font-geist text-xs text-gray-500 dark:text-gray-400">
          {t('businessHome.aiCredits.page.noRollover')}
        </Text>
      </View>
    </BusinessHomeCard>
  );
}
