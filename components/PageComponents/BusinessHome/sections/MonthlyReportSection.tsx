import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';
import type { BusinessHomeSheetId } from '../sheets/types';

interface MonthlyReportSectionProps {
  isPaidMember: boolean;
  onOpenSheet: (id: BusinessHomeSheetId) => void;
}

export function MonthlyReportSection({
  isPaidMember,
  onOpenSheet,
}: MonthlyReportSectionProps) {
  const { t } = useTranslation();

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  const promoteTools = [
    { icon: '📣', labelKey: 'businessHome.shortcuts.promote' },
    { icon: '🧾', labelKey: 'businessHome.shortcuts.campaigns' },
    { icon: '↻', labelKey: 'businessHome.tools.repeatCampaign' },
  ] as const;

  return (
    <MembershipGate isPaidMember={isPaidMember} tier="paid">
      <SectionHeading title={t('businessHome.sections.monthlyReport')} />
      <BusinessHomeCard>
        <Pressable
          onPress={() => onOpenSheet('report')}
          accessibilityRole="button"
          className="flex-row items-center gap-2.5 py-1"
        >
          <Text className="flex-1 font-geist-bold text-[13px] text-ink dark:text-gray-100">
            📊 {t('businessHome.monthlyReport.rowTitle')}
          </Text>
          <Text className="font-geist-extrabold text-xs text-brand">
            {t('businessHome.monthlyReport.ready')}
          </Text>
        </Pressable>
      </BusinessHomeCard>
      <Text className="px-5 pb-1.5 pt-3 font-geist-extrabold text-[10px] uppercase tracking-widest text-gray-500">
        {t('businessHome.sections.promoteTools')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-1.5 px-4 pb-1"
      >
        {promoteTools.map((tool) => (
          <Pressable
            key={tool.labelKey}
            onPress={showComingSoon}
            accessibilityRole="button"
            className="min-h-10 flex-row items-center gap-1.5 rounded-full bg-paper px-3.5 dark:bg-gray-800"
          >
            <Text>{tool.icon}</Text>
            <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
              {t(tool.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </MembershipGate>
  );
}

export function UpsellSection({ isPaidMember }: { isPaidMember: boolean }) {
  const { t } = useTranslation();

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

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
        <View className="flex-row items-baseline justify-between">
          <Text className="font-geist-extrabold text-[15px] text-ink dark:text-gray-100">
            {t('businessHome.upsell.membership')}
          </Text>
          <Text className="font-geist-extrabold text-xl text-ink dark:text-gray-100">
            $39<Text className="text-xs text-gray-500">{t('businessHome.upsell.perMonth')}</Text>
          </Text>
        </View>
        <Text className="mt-1 font-geist text-xs leading-[1.5] text-gray-600 dark:text-gray-400">
          {t('businessHome.upsell.body')}
        </Text>
        <Text className="mt-1.5 font-geist text-xs leading-[1.5] text-gray-600 dark:text-gray-400">
          {t('businessHome.upsell.paymentNote')}
        </Text>
        <View className="mt-2">
          {includes.map((key) => (
            <View key={key} className="flex-row items-baseline gap-2 py-0.5">
              <Text className="font-geist-extrabold text-success">✓</Text>
              <Text className="flex-1 font-geist-semibold text-xs text-gray-600 dark:text-gray-400">
                {t(key)}
              </Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={showComingSoon}
          accessibilityRole="button"
          className="mt-3 min-h-12 items-center justify-center rounded-full bg-brand"
        >
          <Text className="font-geist-extrabold text-[14.5px] text-white">
            {t('businessHome.upsell.trial')}
          </Text>
        </Pressable>
        <Text className="mt-2 font-geist-semibold text-[11px] leading-[1.55] text-gray-500">
          {t('businessHome.upsell.finePrint')}
        </Text>
      </BusinessHomeCard>
    </MembershipGate>
  );
}

export function FooterNoteSection() {
  const { t } = useTranslation();
  return (
    <Text className="px-9 pb-20 pt-4 text-center font-geist-semibold text-[11px] leading-[1.55] text-gray-500 dark:text-gray-400">
      {t('businessHome.footerNote')}
    </Text>
  );
}
