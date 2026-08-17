import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BUSINESS_HOME_DEMAND_ROWS,
  BUSINESS_HOME_DIFF_CHIPS,
  BUSINESS_HOME_EXPLORE_CHIPS,
  BUSINESS_HOME_PERFORMANCE_ROWS,
} from '@/constants/businessHomeMock';
import type { BusinessHomePersonalityRow } from '@/hooks/useBusinessHomeData';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';

type ExploreTab = 'customers' | 'demand' | 'performance';

interface ExploreInsightsSectionProps {
  personalityRows: BusinessHomePersonalityRow[];
  isPaidMember: boolean;
}

function ChipRow({
  chips,
}: {
  chips: { label: string; count: string; hot?: boolean }[];
}) {
  return (
    <View className="mt-2 flex-row flex-wrap gap-1.5">
      {chips.map((chip) => (
        <View
          key={chip.label}
          className={`rounded-full px-2.5 py-1 ${
            chip.hot ? 'bg-brand-tint' : 'bg-soft dark:bg-gray-900'
          }`}
        >
          <Text
            className={`font-geist-bold text-xs ${
              chip.hot ? 'text-brand-dark' : 'text-ink dark:text-gray-100'
            }`}
          >
            {chip.label}
            <Text className="text-gray-500"> {chip.count}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ExploreInsightsSection({
  personalityRows,
  isPaidMember,
}: ExploreInsightsSectionProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ExploreTab>('customers');

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  const tabs: { id: ExploreTab; labelKey: string }[] = [
    { id: 'customers', labelKey: 'businessHome.explore.customers' },
    { id: 'demand', labelKey: 'businessHome.explore.demand' },
    { id: 'performance', labelKey: 'businessHome.explore.performance' },
  ];

  return (
    <>
      <SectionHeading title={t('businessHome.sections.exploreInsights')} />
      <View className="flex-row gap-1.5 px-4">
        {tabs.map((item) => {
          const selected = tab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              className={`min-h-10 flex-1 items-center justify-center rounded-full border ${
                selected
                  ? 'border-ink bg-ink dark:border-gray-100 dark:bg-gray-100'
                  : 'border-gray-200 bg-paper dark:border-gray-600 dark:bg-gray-800'
              }`}
            >
              <Text
                className={`font-geist-bold text-[12.5px] ${
                  selected ? 'text-white dark:text-ink' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {t(item.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'customers' ? (
        <View className="mt-2.5">
          <BusinessHomeCard>
            <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
              {t('businessHome.explore.whatCustomersSay')}
            </Text>
            <ChipRow chips={BUSINESS_HOME_EXPLORE_CHIPS} />
            <Text className="mt-2 font-geist-semibold text-[11px] text-gray-500">
              {t('businessHome.explore.customersSource')}
            </Text>
            <Pressable onPress={showComingSoon} accessibilityRole="button">
              <Text className="mt-2 font-geist-bold text-[11.5px] text-brand underline">
                {t('businessHome.explore.viewAllCustomers')}
              </Text>
            </Pressable>
          </BusinessHomeCard>
          <BusinessHomeCard className="mt-2">
            <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
              {t('businessHome.explore.whoTheyAre')}
            </Text>
            <View className="mt-2 h-2 flex-row overflow-hidden rounded-full">
              {personalityRows.map((row) => (
                <View
                  key={row.label}
                  style={{ width: `${row.percentage}%`, backgroundColor: row.color }}
                />
              ))}
            </View>
            <View className="mt-2 gap-1">
              {personalityRows.map((row) => (
                <View key={row.label} className="flex-row items-center gap-2">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
                    {row.percentage}% {row.label}
                  </Text>
                </View>
              ))}
            </View>
            <Text className="mt-2 font-geist-semibold text-[11px] text-gray-500">
              {t('businessHome.explore.personalitySource')}
            </Text>
            <MembershipGate isPaidMember={isPaidMember} tier="paid">
              <Text className="mt-1 font-geist-semibold text-[11px] text-gray-500">
                {t('businessHome.explore.personalityPaidNote')}
              </Text>
            </MembershipGate>
          </BusinessHomeCard>
          <BusinessHomeCard className="mt-2">
            <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
              {t('businessHome.explore.whatMakesDifferent')}
            </Text>
            <ChipRow chips={BUSINESS_HOME_DIFF_CHIPS} />
            <Text className="mt-2 font-geist-semibold text-[11px] text-gray-500">
              {t('businessHome.explore.diffSource')}
            </Text>
            <MembershipGate isPaidMember={isPaidMember} tier="paid">
              <Text className="mt-1 font-geist-semibold text-[11px] text-gray-500">
                {t('businessHome.explore.diffPaidNote')}
              </Text>
            </MembershipGate>
          </BusinessHomeCard>
        </View>
      ) : null}

      {tab === 'demand' ? (
        <BusinessHomeCard className="mt-2.5">
          {BUSINESS_HOME_DEMAND_ROWS.map((row, index) => (
            <View
              key={row.query}
              className={`flex-row items-center gap-2.5 py-2 ${
                index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
              }`}
            >
              <Text className="flex-1 font-geist-bold text-[13px] text-ink dark:text-gray-100">
                {row.query}
              </Text>
              <Text
                className={`font-geist-semibold text-xs ${
                  row.highlight ? 'text-brand' : 'text-gray-500'
                }`}
              >
                {row.meta}
              </Text>
            </View>
          ))}
          <Text className="font-geist-semibold text-[11px] text-gray-500">
            {t('businessHome.explore.demandSource')}
          </Text>
          <Pressable onPress={showComingSoon} accessibilityRole="button">
            <Text className="mt-2 font-geist-bold text-[11.5px] text-brand underline">
              {t('businessHome.explore.viewDemandReport')}
            </Text>
          </Pressable>
          <Text className="mt-2 font-geist text-xs text-gray-600 dark:text-gray-400">
            {t('businessHome.explore.demandOpportunity')}
          </Text>
          <LocalNotesButton
            label={t('businessHome.buttons.createOffer')}
            onPress={showComingSoon}
            variant="brand"
            size="xs"
            isRounded
            isWidthFull={false}
            className="mt-2 self-start"
          />
          <View className="mt-2 px-0">
            <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">
              {t('businessHome.explore.whenFindYou')}
            </Text>
            <View className="mt-1">
              <View className="flex-row justify-between py-1">
                <Text className="text-xs text-gray-600">{t('businessHome.explore.strongest')}</Text>
                <Text className="font-geist-bold text-xs">7–10 AM</Text>
              </View>
              <View className="flex-row justify-between py-1">
                <Text className="text-xs text-gray-600">{t('businessHome.explore.quietest')}</Text>
                <Text className="font-geist-bold text-xs">2–5 PM</Text>
              </View>
            </View>
            <LocalNotesButton
              label={t('businessHome.buttons.createMorningOffer')}
              onPress={showComingSoon}
              variant="light"
              size="xs"
              isRounded
              isWidthFull={false}
              className="mt-1 self-start"
            />
          </View>
        </BusinessHomeCard>
      ) : null}

      {tab === 'performance' ? (
        <BusinessHomeCard className="mt-2.5">
          {BUSINESS_HOME_PERFORMANCE_ROWS.map((row, index) => (
            <View
              key={row.title}
              className={`flex-row items-center gap-2.5 py-2 ${
                index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
              }`}
            >
              <Text className="flex-1 font-geist-bold text-[13px] text-ink dark:text-gray-100">
                {row.title}
              </Text>
              <Text className="font-geist-semibold text-xs text-gray-500">{row.meta}</Text>
            </View>
          ))}
          <Text className="font-geist-semibold text-[11px] text-gray-500">
            {t('businessHome.explore.performanceSource')}
          </Text>
          <Pressable onPress={showComingSoon} accessibilityRole="button">
            <Text className="mt-2 font-geist-bold text-[11.5px] text-brand underline">
              {t('businessHome.explore.viewPerformanceReport')}
            </Text>
          </Pressable>
        </BusinessHomeCard>
      ) : null}
    </>
  );
}
