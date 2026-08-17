import { Alert, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { MembershipGate } from '../ui/MembershipGate';

interface InsightSummarySectionProps {
  isPaidMember: boolean;
}

export function InsightSummarySection({ isPaidMember }: InsightSummarySectionProps) {
  const { t } = useTranslation();

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  return (
    <>
      <MembershipGate isPaidMember={isPaidMember} tier="paid">
        <BusinessHomeCard className="mt-2">
          <Text className="font-geist text-xs leading-[1.55] text-gray-600 dark:text-gray-400">
            {t('businessHome.insight.paidBody')}
          </Text>
          <Text className="mt-1.5 font-geist-semibold text-[11px] text-gray-500 dark:text-gray-400">
            {t('businessHome.insight.paidSource')}
          </Text>
        </BusinessHomeCard>
      </MembershipGate>

      <MembershipGate isPaidMember={isPaidMember} tier="free">
        <BusinessHomeCard className="mt-2">
          <Text className="font-geist text-xs leading-[1.55] text-gray-600 dark:text-gray-400">
            {t('businessHome.insight.freeBody')}
          </Text>
          <Text className="mt-1.5 font-geist-semibold text-[11px] text-gray-500 dark:text-gray-400">
            {t('businessHome.insight.freeSource')}
          </Text>
          <LocalNotesButton
            label={t('businessHome.insight.seeInsights')}
            onPress={showComingSoon}
            variant="light"
            size="xs"
            isRounded
            isWidthFull={false}
            className="mt-2.5 self-start"
          />
        </BusinessHomeCard>
      </MembershipGate>
    </>
  );
}
