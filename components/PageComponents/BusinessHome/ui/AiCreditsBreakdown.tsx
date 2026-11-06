import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AiCreditsDetailDAO } from '@/http/business-api/types';
import {
  averageCredits,
  featureLabelKey,
  hasPendingCredits,
  showTeamRows,
  usedByTeam,
} from '@/utils/aiCredits';
import { BusinessHomeCard } from './BusinessHomeCard';
import { KeyValueRow } from './KeyValueRow';

interface AiCreditsBreakdownProps {
  detail: AiCreditsDetailDAO;
}

/** Used / remaining / allowance / you / team rows, plus one row per AI feature. */
export function AiCreditsBreakdown({ detail }: AiCreditsBreakdownProps) {
  const { t } = useTranslation();

  return (
    <>
      <BusinessHomeCard className="mt-3">
        <KeyValueRow
          label={t('businessHome.aiCredits.page.usedSoFar')}
          value={String(detail.used)}
        />
        {hasPendingCredits(detail) ? (
          <Text className="pb-1 font-geist text-[11px] text-gray-500 dark:text-gray-400">
            {t('businessHome.aiCredits.page.usedSoFarPending')}
          </Text>
        ) : null}
        <KeyValueRow
          label={t('businessHome.aiCredits.page.remaining')}
          value={String(detail.remaining)}
        />
        <KeyValueRow
          label={t('businessHome.aiCredits.page.monthlyAllowance')}
          value={String(detail.allowance)}
        />
        <KeyValueRow
          label={t('businessHome.aiCredits.page.byYou')}
          value={String(detail.used_by_you)}
        />
        {showTeamRows(detail.team_size) ? (
          <KeyValueRow
            label={t('businessHome.aiCredits.page.byTeam')}
            value={String(usedByTeam(detail.used, detail.used_by_you))}
          />
        ) : null}
      </BusinessHomeCard>

      {detail.by_feature.length > 0 ? (
        <BusinessHomeCard className="mt-3">
          <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
            {t('businessHome.aiCredits.page.byFeature')}
          </Text>
          <View className="mt-1">
            {detail.by_feature.map((row) => (
              <Text
                key={row.feature}
                className="py-1 font-geist text-[13px] text-gray-600 dark:text-gray-400"
              >
                {t('businessHome.aiCredits.page.featureRow', {
                  feature: t(featureLabelKey(row.feature)),
                  credits: row.credits,
                  count: row.count,
                  avg: averageCredits(row.credits, row.count),
                })}
              </Text>
            ))}
          </View>
        </BusinessHomeCard>
      ) : null}
    </>
  );
}
