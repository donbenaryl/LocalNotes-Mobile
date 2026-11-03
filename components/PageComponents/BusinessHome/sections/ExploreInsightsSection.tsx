import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useOpenCreateOfferOnWeb } from '@/hooks/useOpenCreateOfferOnWeb';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { formatCompactNumber } from '@/utils/formatCompactNumber';
import { getBusinessPersonalityLabel } from '@/utils/businessPersonalityLabels';
import { formatDelta, visibleInsightNote } from '@/utils/insightsFormat';
import { topPercentValue } from '@/utils/insightsDetailModels';
import { peakHoursReasonKey } from '@/utils/insightsReasons';
import { quietestToPrefill } from '@/utils/offerPrefill';
import type {
  BusinessCustomerInsightsDAO,
  BusinessDemandInsightsDAO,
  BusinessInsightsTab,
  BusinessInsightsWindow,
  BusinessPeakHourRangeDAO,
  BusinessPerformanceInsightsDAO,
  BusinessPerformanceRowDAO,
} from '@/http/business-api/types';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import {
  CardTitle,
  ChipRow,
  InsightsTabState,
  SectionInsufficient,
  SourceText,
  isReady,
  type InsightsTabQuery,
} from '../ui/InsightsParts';
import { MembershipGate } from '../ui/MembershipGate';

interface ExploreInsightsSectionProps {
  activeTab: BusinessInsightsTab;
  customers: InsightsTabQuery<BusinessCustomerInsightsDAO>;
  demand: InsightsTabQuery<BusinessDemandInsightsDAO>;
  performance: InsightsTabQuery<BusinessPerformanceInsightsDAO>;
  isPaidMember: boolean;
}

/** Chips arrive sorted by lift; the strongest ones get the brand highlight. */
const HIGHLIGHTED_DIFFERENTIATORS = 2;

function formatHour(hour: number, locale: string): string {
  return new Date(2000, 0, 1, hour).toLocaleTimeString(locale, { hour: 'numeric' });
}

function formatHourRange(range: BusinessPeakHourRangeDAO, locale: string): string {
  return `${formatHour(range.start_hour, locale)}–${formatHour(range.end_hour, locale)}`;
}

function formatMetricValue(row: BusinessPerformanceRowDAO, value: number): string {
  return row.key === 'audience_fit' ? `${Math.round(value)}%` : formatCompactNumber(value);
}

export function ExploreInsightsSection({
  activeTab,
  customers,
  demand,
  performance,
  isPaidMember,
}: ExploreInsightsSectionProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const openCreateOfferOnWeb = useOpenCreateOfferOnWeb();

  const openDetail = (
    pathname:
      | '/business-customers-detail'
      | '/business-demand-detail'
      | '/business-performance-detail',
    window: BusinessInsightsWindow,
  ) => {
    router.push({ pathname, params: { window } });
  };

  const windowPeriod = (window: BusinessInsightsWindow) =>
    t(`businessHome.explore.windowOptions.${window}`);

  return (
    <>
      {activeTab === 'customers' ? (
        <InsightsTabState query={customers}>
          {(data) => {
            const period = windowPeriod(data.window);
            const keywords = data.customer_keywords;
            const personality = data.customer_personality;
            const differentiators = data.customer_differentiators;
            const personalityNote = isReady(personality)
              ? visibleInsightNote(personality.insight_note)
              : null;
            const differentiatorsNote = isReady(differentiators)
              ? visibleInsightNote(differentiators.insight_note)
              : null;
            return (
              <View className="mt-2.5">
                <BusinessHomeCard>
                  <CardTitle>{t('businessHome.explore.whatCustomersSay')}</CardTitle>
                  {isReady(keywords) ? (
                    <>
                      <ChipRow
                        chips={keywords.chips.map((chip) => ({
                          label: chip.label,
                          count: formatCompactNumber(chip.count),
                          hot: chip.hot,
                        }))}
                      />
                      <SourceText>
                        {keywords.savers_count > 0
                          ? t('businessHome.explore.customersSource', {
                              notes: formatCompactNumber(keywords.notes_count),
                              count: formatCompactNumber(keywords.savers_count),
                              period,
                            })
                          : t('businessHome.explore.customersSourceNoSavers', {
                              notes: formatCompactNumber(keywords.notes_count),
                              period,
                            })}
                      </SourceText>
                    </>
                  ) : (
                    <SectionInsufficient />
                  )}
                  <Pressable
                    onPress={() => openDetail('/business-customers-detail', data.window)}
                    accessibilityRole="button"
                  >
                    <Text className="mt-2 font-geist-bold text-[11.5px] text-brand underline">
                      {t('businessHome.explore.viewAllCustomers')}
                    </Text>
                  </Pressable>
                </BusinessHomeCard>
                <BusinessHomeCard className="mt-2">
                  <CardTitle>{t('businessHome.explore.whoTheyAre')}</CardTitle>
                  {isReady(personality) ? (
                    <>
                      <View className="mt-2 h-2 flex-row overflow-hidden rounded-full">
                        {personality.rows.map((row) => (
                          <View
                            key={row.color}
                            style={{ width: `${row.percentage}%`, backgroundColor: row.color }}
                          />
                        ))}
                      </View>
                      <View className="mt-2 gap-1">
                        {personality.rows.map((row) => (
                          <View key={row.color} className="flex-row items-center gap-2">
                            <View
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: row.color }}
                            />
                            <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
                              {Math.round(row.percentage)}%{' '}
                              {getBusinessPersonalityLabel(row.color_name)}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <SourceText>
                        {[
                          t('businessHome.explore.personalitySource', {
                            count: formatCompactNumber(personality.cohort_size),
                            period,
                          }),
                          personality.top_area
                            ? t('businessHome.explore.personalityTopArea', {
                                area: personality.top_area,
                              })
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </SourceText>
                    </>
                  ) : (
                    <SectionInsufficient />
                  )}
                  <MembershipGate isPaidMember={isPaidMember} tier="paid">
                    {personalityNote ? (
                      <Text className="mt-1 font-geist-semibold text-[11px] text-gray-500">
                        {personalityNote}
                      </Text>
                    ) : null}
                  </MembershipGate>
                </BusinessHomeCard>
                <BusinessHomeCard className="mt-2">
                  <CardTitle>{t('businessHome.explore.whatMakesDifferent')}</CardTitle>
                  {isReady(differentiators) ? (
                    <>
                      <ChipRow
                        chips={differentiators.chips.map((chip, index) => ({
                          label: chip.label,
                          count: `${chip.lift}×`,
                          hot: index < HIGHLIGHTED_DIFFERENTIATORS,
                        }))}
                      />
                      <SourceText>
                        {t('businessHome.explore.diffSource', {
                          peers: differentiators.peer_count,
                          label: differentiators.peer_label ?? '',
                          period,
                        })}
                      </SourceText>
                    </>
                  ) : (
                    <SectionInsufficient />
                  )}
                  <MembershipGate isPaidMember={isPaidMember} tier="paid">
                    {differentiatorsNote ? (
                      <Text className="mt-1 font-geist-semibold text-[11px] text-gray-500">
                        {differentiatorsNote}
                      </Text>
                    ) : null}
                  </MembershipGate>
                </BusinessHomeCard>
              </View>
            );
          }}
        </InsightsTabState>
      ) : null}

      {activeTab === 'demand' ? (
        <InsightsTabState query={demand}>
          {(data) => {
            const topics = data.demand_topics;
            const peakHours = data.demand_peak_hours;
            const morningOfferPrefill = quietestToPrefill(peakHours);
            const opportunityDelta = isReady(topics)
              ? formatDelta(topics.opportunity?.delta_pct)
              : '';
            return (
              <BusinessHomeCard className="mt-2.5">
                {isReady(topics) ? (
                  <>
                    {topics.rows.map((row, index) => {
                      const delta = formatDelta(row.delta_pct);
                      return (
                        <View
                          key={`${row.source}-${row.query}`}
                          className={`flex-row items-center gap-2.5 py-2 ${
                            index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
                          }`}
                        >
                          <Text className="flex-1 font-geist-bold text-[13px] text-ink dark:text-gray-100">
                            {t('businessHome.explore.demandQuery', { query: row.query })}
                          </Text>
                          <Text
                            className={`font-geist-semibold text-xs ${
                              (row.delta_pct ?? 0) > 0 ? 'text-brand' : 'text-gray-500'
                            }`}
                          >
                            {[formatCompactNumber(row.volume), delta].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                      );
                    })}
                    <SourceText>
                      {t(
                        topics.source === 'smart_pick+search'
                          ? 'businessHome.explore.demandSourceWithSearch'
                          : 'businessHome.explore.demandSource',
                        { period: topics.period_label },
                      )}
                    </SourceText>
                  </>
                ) : (
                  <SectionInsufficient />
                )}
                <Pressable
                  onPress={() => openDetail('/business-demand-detail', data.window)}
                  accessibilityRole="button"
                >
                  <Text className="mt-2 font-geist-bold text-[11.5px] text-brand underline">
                    {t('businessHome.explore.viewDemandReport')}
                  </Text>
                </Pressable>
                {isReady(topics) && topics.opportunity ? (
                  <Text className="mt-2 font-geist text-xs text-gray-600 dark:text-gray-400">
                    {opportunityDelta
                      ? t('businessHome.explore.demandOpportunityWithDelta', {
                          query: topics.opportunity.query,
                          delta: opportunityDelta,
                        })
                      : t('businessHome.explore.demandOpportunity', {
                          query: topics.opportunity.query,
                        })}
                  </Text>
                ) : null}
                <LocalNotesButton
                  label={t('businessHome.buttons.createOffer')}
                  onPress={() => void openCreateOfferOnWeb()}
                  variant="brand"
                  size="xs"
                  isWidthFull={false}
                  className="mt-2 self-end"
                />
                <View className="mt-2 px-0">
                  <CardTitle>{t('businessHome.explore.whenFindYou')}</CardTitle>
                  {isReady(peakHours) && peakHours.strongest && peakHours.quietest ? (
                    <View className="mt-1">
                      <View className="flex-row justify-between py-1">
                        <Text className="text-xs text-gray-600 dark:text-gray-400">
                          {t('businessHome.explore.strongest')}
                        </Text>
                        <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
                          {formatHourRange(peakHours.strongest, i18n.language)}
                        </Text>
                      </View>
                      <View className="flex-row justify-between py-1">
                        <Text className="text-xs text-gray-600 dark:text-gray-400">
                          {t('businessHome.explore.quietest')}
                        </Text>
                        <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
                          {formatHourRange(peakHours.quietest, i18n.language)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <SectionInsufficient messageKey={peakHoursReasonKey(peakHours?.reason)} />
                  )}

                  <LocalNotesButton
                    label={t('businessHome.buttons.createMorningOffer')}
                    onPress={() => void openCreateOfferOnWeb(morningOfferPrefill)}
                    disabled={!morningOfferPrefill}
                    variant="light"
                    size="xs"
                    isWidthFull={false}
                    className="mt-1 self-end"
                  />
                </View>
              </BusinessHomeCard>
            );
          }}
        </InsightsTabState>
      ) : null}

      {activeTab === 'performance' ? (
        <InsightsTabState query={performance}>
          {(data) => {
            const summary = data.performance_summary;
            const period = windowPeriod(data.window);
            return (
              <BusinessHomeCard className="mt-2.5">
                {isReady(summary) ? (
                  <>
                    {summary.rows.map((row, index) => {
                      const metric = t(`businessHome.explore.performanceMetrics.${row.key}`);
                      const value = formatMetricValue(row, row.value);
                      const title =
                        row.peer_avg === null
                          ? t('businessHome.explore.performanceRowNoPeers', { metric, value })
                          : t('businessHome.explore.performanceRow', {
                              metric,
                              value,
                              peer: formatMetricValue(row, row.peer_avg),
                            });
                      const meta = [
                        topPercentValue(row.percentile) !== null
                          ? t('businessHome.explore.topPercent', {
                              percent: topPercentValue(row.percentile),
                            })
                          : null,
                        formatDelta(row.delta),
                      ]
                        .filter(Boolean)
                        .join(' · ');
                      return (
                        <View
                          key={row.key}
                          className={`flex-row items-center gap-2.5 py-2 ${
                            index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
                          }`}
                        >
                          <Text className="flex-1 font-geist-bold text-[13px] text-ink dark:text-gray-100">
                            {title}
                          </Text>
                          <Text className="font-geist-semibold text-xs text-gray-500">
                            {meta}
                          </Text>
                        </View>
                      );
                    })}
                    <SourceText>
                      {summary.peer_count > 0
                        ? t('businessHome.explore.performanceSource', {
                            peers: summary.peer_count,
                            label: summary.peer_label ?? '',
                            period,
                          })
                        : t('businessHome.explore.performanceSourceNoPeers', { period })}
                    </SourceText>
                  </>
                ) : (
                  <SectionInsufficient />
                )}
                <Pressable
                  onPress={() => openDetail('/business-performance-detail', data.window)}
                  accessibilityRole="button"
                >
                  <Text className="mt-2 font-geist-bold text-[11.5px] text-brand underline">
                    {t('businessHome.explore.viewPerformanceReport')}
                  </Text>
                </Pressable>
              </BusinessHomeCard>
            );
          }}
        </InsightsTabState>
      ) : null}
    </>
  );
}
