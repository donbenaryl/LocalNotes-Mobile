import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { MembershipGate } from '../ui/MembershipGate';
import type { BusinessHomeToplineProps } from '../BusinessHomeTopline';
import { useBusinessInterpretation } from '@/hooks/useBusinessInterpretation';
import { useOpenBusinessInsightsOnWeb } from '@/hooks/useOpenBusinessInsightsOnWeb';
import { useBusinessStore } from '@/stores/useBusinessStore';
import {
  buildInterpretationSentence,
  formatFreeBodyDeltas,
  getInterpretationCardState,
} from '@/utils/insightInterpretation';

interface InsightSummarySectionProps {
  isPaidMember: boolean;
  dateFrom: string;
  dateTo: string;
  topline: BusinessHomeToplineProps;
}

const BODY_CLASS = 'font-geist text-xs leading-[1.55] text-gray-600 dark:text-gray-400';
const SOURCE_CLASS = 'mt-1.5 font-geist-semibold text-[11px] text-gray-500 dark:text-gray-400';

export function InsightSummarySection({
  isPaidMember,
  dateFrom,
  dateTo,
  topline,
}: InsightSummarySectionProps) {
  const { t } = useTranslation();
  const businessId = useBusinessStore((s) => s.businessId);
  const openInsightsOnWeb = useOpenBusinessInsightsOnWeb();
  const query = useBusinessInterpretation({
    businessId,
    range: { date_from: dateFrom, date_to: dateTo },
    isPaidMember,
  });
  const state = getInterpretationCardState({
    isPending: query.isPending,
    error: query.error,
    data: query.data,
  });

  const renderPaidBody = () => {
    switch (state.kind) {
      case 'loading':
        return <Text className={BODY_CLASS}>{t('businessHome.insight.auto.loading')}</Text>;
      case 'notEntitled':
        return <Text className={BODY_CLASS}>{t('businessHome.insight.auto.notEntitled')}</Text>;
      case 'error':
        return (
          <>
            <Text className={BODY_CLASS}>{t('businessHome.insight.auto.error')}</Text>
            <Pressable onPress={() => void query.refetch()} accessibilityRole="button" hitSlop={8}>
              <Text className="mt-1.5 font-geist-semibold text-xs text-brand">
                {t('businessHome.insight.auto.retry')}
              </Text>
            </Pressable>
          </>
        );
      case 'insufficient':
        return (
          <Text className={BODY_CLASS}>
            {t(`businessHome.insight.auto.insufficient.${state.reason}`)}
          </Text>
        );
      case 'ready':
        return (
          <>
            <Text className={BODY_CLASS}>{buildInterpretationSentence(state.data, t)}</Text>
            <Text className={SOURCE_CLASS}>{t('businessHome.insight.paidSource')}</Text>
          </>
        );
    }
  };

  return (
    <>
      {/* Automatic interpretation Section */}
      <MembershipGate isPaidMember={isPaidMember} tier="paid">
        <BusinessHomeCard className="mt-2">{renderPaidBody()}</BusinessHomeCard>
      </MembershipGate>

      <MembershipGate isPaidMember={isPaidMember} tier="free">
        <BusinessHomeCard className="mt-2">
          <Text className={BODY_CLASS}>
            {t('businessHome.insight.freeBody', formatFreeBodyDeltas(topline))}
          </Text>
          <Text className={SOURCE_CLASS}>{t('businessHome.insight.freeSource')}</Text>
          <LocalNotesButton
            label={t('businessHome.insight.seeInsights')}
            onPress={() => void openInsightsOnWeb()}
            size="xs"
            isWidthFull={false}
            className="mt-2.5 self-end"
          />
        </BusinessHomeCard>
      </MembershipGate>
    </>
  );
}
