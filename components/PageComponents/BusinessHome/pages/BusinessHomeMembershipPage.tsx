import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOpenBusinessInsightsOnWeb } from '@/hooks/useOpenBusinessInsightsOnWeb';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { UpsellSection } from '../sections/MonthlyReportSection';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

interface BusinessHomeMembershipPageProps {
  isPaidMember: boolean;
  onBack: () => void;
}

export function BusinessHomeMembershipPage({
  isPaidMember,
  onBack,
}: BusinessHomeMembershipPageProps) {
  const { t } = useTranslation();

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.pages.membership')}
      onBack={onBack}
    >
      <View className="mt-4">
        <BusinessHomeCard>
          <Text className="font-geist-semibold text-xs text-gray-500 dark:text-gray-400">
            {t('businessHome.membershipPage.currentPlan')}
          </Text>
          <Text className="mt-1 font-geist-extrabold text-xl text-ink dark:text-gray-100">
            {isPaidMember
              ? t('businessHome.sections.businessInsights')
              : t('businessHome.membershipPage.freePlan')}
          </Text>
          <Text className="mt-2 font-geist text-xs leading-[1.5] text-gray-600 dark:text-gray-400">
            {t('businessHome.membershipPage.freeBody')}
          </Text>
        </BusinessHomeCard>
        <Text className="px-5 py-3 font-geist text-xs leading-[1.5] text-gray-500 dark:text-gray-400">
          {t('businessHome.membershipPage.upgradeNote')}
        </Text>
        <UpsellSection isPaidMember={isPaidMember} />
      </View>
    </BusinessHomeDetailShell>
  );
}
