import { Pressable, Text, View } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useOpenBusinessInsightsOnWeb } from '@/hooks/useOpenBusinessInsightsOnWeb';
import { useBusinessMonthlyReport } from '@/hooks/useBusinessMonthlyReport';
import { formatReportMonth, reportView, rowCopyKey } from '@/utils/businessMonthlyReport';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';
import type { BusinessHomeSheetId } from '../sheets/types';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';

interface MonthlyReportSectionProps {
  businessId: string;
  isPaidMember: boolean;
  onOpenSheet: (id: BusinessHomeSheetId) => void;
}

export function MonthlyReportSection({
  businessId,
  isPaidMember,
  onOpenSheet,
}: MonthlyReportSectionProps) {
  const { t, i18n } = useTranslation();
  const query = useBusinessMonthlyReport({ businessId, isPaidMember });
  const report = query.data;
  const view = reportView(report);
  const month = formatReportMonth(report?.month_start, i18n.language);
  const isError = query.isError && !report;
  // Brand colour only for a ready report; every other state is muted.
  const statusClass =
    view === 'report' ? 'text-brand dark:text-dk-text' : 'text-gray-500 dark:text-dk-muted';

  return (
    <MembershipGate isPaidMember={isPaidMember} tier="paid">
      <SectionHeading title={t('businessHome.sections.monthlyReport')} />
      <BusinessHomeCard>
        <Pressable
          onPress={() => (isError ? void query.refetch() : onOpenSheet('report'))}
          accessibilityRole="button"
          className="flex-row items-center gap-2.5 py-1"
        >
          <View className="flex-1 flex-row items-center gap-1.5">
            <BarChart3 size={16} color="#1A1714" />
            <Text className="font-geist-bold text-[13px] text-ink dark:text-dk-text">
              {t('businessHome.monthlyReport.rowTitle')}
            </Text>
          </View>
          <Text className={`font-geist-extrabold text-xs ${statusClass}`}>
            {isError
              ? t('businessHome.monthlyReport.error')
              : t(rowCopyKey(view), { month })}
          </Text>
        </Pressable>
      </BusinessHomeCard>
    </MembershipGate>
  );
}

export function UpsellSection({ isPaidMember }: { isPaidMember: boolean }) {
  const { t } = useTranslation();
  const openBusinessInsightsOnWeb = useOpenBusinessInsightsOnWeb();

  const includes = [
    'businessHome.upsell.includes.copilot',
    'businessHome.upsell.includes.brief',
    'businessHome.upsell.includes.alerts',
    'businessHome.upsell.includes.interpretation',
    'businessHome.upsell.includes.actionPlans',
    'businessHome.upsell.includes.campaignIntel',
  ] as const;

  return (
    <MembershipGate isPaidMember={isPaidMember} tier="free">
      <SectionHeading title={t('businessHome.sections.businessInsights')} />
      <BusinessHomeCard variant="upsell">
        <Text className="font-geist-extrabold text-[15px] text-ink dark:text-dk-text">
          {t('businessHome.upsell.membership')}
        </Text>
        <Text className="mt-1 font-geist text-xs leading-[1.5] text-gray-600 dark:text-dk-muted">
          {t('businessHome.upsell.body')}
        </Text>
        <Text className="mt-1.5 font-geist text-xs leading-[1.5] text-gray-600 dark:text-dk-muted">
          {t('businessHome.upsell.paymentNote')}
        </Text>
        <View className="mt-2">
          {includes.map((key) => (
            <View key={key} className="flex-row items-baseline gap-2 py-0.5">
              <Text className="font-geist-extrabold text-success">✓</Text>
              <Text className="flex-1 font-geist-semibold text-xs text-gray-600 dark:text-dk-muted">
                {t(key)}
              </Text>
            </View>
          ))}
        </View>
        <LocalNotesButton
          label={t('businessHome.upsell.continueOnWeb')}
          onPress={() => void openBusinessInsightsOnWeb()}
          variant="brand"
          size="sm"
          className="mt-3 justify-center"
        />
  
      </BusinessHomeCard>
    </MembershipGate>
  );
}

export function FooterNoteSection() {
  const { t } = useTranslation();
  return (
    <Text className="px-9 pb-20 pt-4 text-center font-geist-semibold text-[11px] leading-[1.55] text-gray-500 dark:text-dk-muted">
      {t('businessHome.footerNote')}
    </Text>
  );
}
