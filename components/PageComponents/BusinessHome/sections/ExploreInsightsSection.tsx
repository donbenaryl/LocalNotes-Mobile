import type { ReactNode } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChartColumn } from 'lucide-react-native';
import { useOpenCreateOfferOnWeb } from '@/hooks/useOpenCreateOfferOnWeb';
import { SavedSectionState } from '@/components/PageComponents/Saved/SavedSectionState';
import { Skeleton } from '@/components/ui/Skeleton';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { formatCompactNumber } from '@/utils/formatCompactNumber';
import { getBusinessPersonalityLabel } from '@/utils/businessPersonalityLabels';
import { cn } from '@/utils/cn';
import type {
  BusinessCustomerInsightsDAO,
  BusinessDemandInsightsDAO,
  BusinessInsightStatus,
  BusinessInsightsTab,
  BusinessInsightsWindow,
  BusinessPeakHourRangeDAO,
  BusinessPerformanceInsightsDAO,
  BusinessPerformanceRowDAO,
} from '@/http/business-api/types';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { MembershipGate } from '../ui/MembershipGate';

/** The slice of a TanStack query result each tab needs. */
export interface InsightsTabQuery<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  isPlaceholderData: boolean;
  refetch: () => unknown;
}

interface ExploreInsightsSectionProps {
  activeTab: BusinessInsightsTab;
  customers: InsightsTabQuery<BusinessCustomerInsightsDAO>;
  demand: InsightsTabQuery<BusinessDemandInsightsDAO>;
  performance: InsightsTabQuery<BusinessPerformanceInsightsDAO>;
  isPaidMember: boolean;
}

/** Peer percentile only reads as a win in the top half. */
const MIN_PERCENTILE_TO_SHOW = 50;
/** Chips arrive sorted by lift; the strongest ones get the brand highlight. */
const HIGHLIGHTED_DIFFERENTIATORS = 2;

function isReady<T extends { status: BusinessInsightStatus }>(
  section: T | null,
): section is T {
  return section?.status === 'ready';
}

function formatDelta(delta: number | null): string {
  if (delta === null || delta === 0) return '';
  return `${delta > 0 ? '↑' : '↓'}${Math.round(Math.abs(delta))}%`;
}

function formatHour(hour: number, locale: string): string {
  return new Date(2000, 0, 1, hour).toLocaleTimeString(locale, { hour: 'numeric' });
}

function formatHourRange(range: BusinessPeakHourRangeDAO, locale: string): string {
  return `${formatHour(range.start_hour, locale)}–${formatHour(range.end_hour, locale)}`;
}

function formatMetricValue(row: BusinessPerformanceRowDAO, value: number): string {
  return row.key === 'audience_fit' ? `${Math.round(value)}%` : formatCompactNumber(value);
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

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">{children}</Text>
  );
}

function SourceText({ children }: { children: ReactNode }) {
  return (
    <Text className="mt-2 font-geist-semibold text-[11px] text-gray-500 dark:text-gray-400">
      {children}
    </Text>
  );
}

function SectionInsufficient() {
  const { t } = useTranslation();
  return (
    <Text className="mt-2 font-geist text-xs text-gray-500 dark:text-gray-400">
      {t('businessHome.explore.insufficientData')}
    </Text>
  );
}

function InsightsTabSkeleton({ label }: { label: string }) {
  return (
    <View className="mt-2.5 gap-2" accessibilityLabel={label}>
      {[0, 1].map((index) => (
        <BusinessHomeCard key={index}>
          <Skeleton className="h-4 w-2/5" />
          <View className="mt-3 flex-row flex-wrap gap-1.5">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </View>
          <Skeleton className="mt-3 h-3 w-3/4" />
        </BusinessHomeCard>
      ))}
      <Text className="mx-4 font-geist text-xs text-gray-500 dark:text-gray-400">{label}</Text>
    </View>
  );
}

function InsightsTabState<T extends { status: BusinessInsightStatus }>({
  query,
  children,
}: {
  query: InsightsTabQuery<T>;
  children: (data: T) => ReactNode;
}) {
  const { t } = useTranslation();
  const isBuilding = query.data?.status === 'building';
  const isPending = !query.isError && (query.isPending || isBuilding);

  return (
    <SavedSectionState
      isPending={isPending}
      isError={query.isError}
      isEmpty={query.data?.status === 'insufficient_data'}
      onRetry={() => void query.refetch()}
      pendingContent={
        <InsightsTabSkeleton
          label={t(isBuilding ? 'businessHome.explore.building' : 'businessHome.explore.loading')}
        />
      }
      errorMessage={t('businessHome.explore.error')}
      retryLabel={t('businessHome.explore.retry')}
      emptyIcon={<ChartColumn size={40} color="#D1D5DB" />}
      emptyTitle={t('businessHome.explore.insufficientData')}
      emptyDescription={t('businessHome.explore.insufficientDataHint')}
    >
      <View className={cn(query.isPlaceholderData && 'opacity-60')}>
        {query.data ? children(query.data) : null}
      </View>
    </SavedSectionState>
  );
}

export function ExploreInsightsSection({
  activeTab,
  customers,
  demand,
  performance,
  isPaidMember,
}: ExploreInsightsSectionProps) {
  const { t, i18n } = useTranslation();
  const openCreateOfferOnWeb = useOpenCreateOfferOnWeb();

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
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
                  <Pressable onPress={showComingSoon} accessibilityRole="button">
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
                    <Text className="mt-1 font-geist-semibold text-[11px] text-gray-500">
                      {t('businessHome.explore.personalityPaidNote')}
                    </Text>
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
                    <Text className="mt-1 font-geist-semibold text-[11px] text-gray-500">
                      {t('businessHome.explore.diffPaidNote')}
                    </Text>
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
                <Pressable onPress={showComingSoon} accessibilityRole="button">
                  <Text className="mt-2 font-geist-bold text-[11.5px] text-brand underline">
                    {t('businessHome.explore.viewDemandReport')}
                  </Text>
                </Pressable>
                {isReady(topics) && topics.opportunity ? (
                  <Text className="mt-2 font-geist text-xs text-gray-600 dark:text-gray-400">
                    {t('businessHome.explore.demandOpportunity', {
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
                    <SectionInsufficient />
                  )}

                  <LocalNotesButton
                    label={t('businessHome.buttons.createMorningOffer')}
                    onPress={showComingSoon}
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
                        row.percentile !== null && row.percentile >= MIN_PERCENTILE_TO_SHOW
                          ? t('businessHome.explore.topPercent', {
                              percent: Math.max(1, 100 - row.percentile),
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
                <Pressable onPress={showComingSoon} accessibilityRole="button">
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
