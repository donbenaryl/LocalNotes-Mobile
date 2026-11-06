import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAiCredits } from '@/hooks/useAiCredits';
import { AI_CREDITS_ROUTE } from '@/utils/copilotRoutes';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { DetailNavRow } from '../ui/DetailNavRow';
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
  const router = useRouter();
  const credits = useAiCredits({ isPaid: isPaidMember }).data;

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
        {isPaidMember ? (
          <DetailNavRow
            className="mb-3"
            title={t('businessHome.aiCredits.page.navRow')}
            previewValue={
              credits
                ? t('businessHome.aiCredits.page.navRowPreview', {
                    remaining: credits.remaining,
                    allowance: credits.allowance,
                  })
                : undefined
            }
            onPress={() => router.push(AI_CREDITS_ROUTE as never)}
          />
        ) : null}
        <UpsellSection isPaidMember={isPaidMember} />
      </View>
    </BusinessHomeDetailShell>
  );
}
