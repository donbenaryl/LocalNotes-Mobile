import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useBusinessInsightsDetail } from '@/hooks/useBusinessInsightsDetail';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { formatCompactNumber } from '@/utils/formatCompactNumber';
import { formatBucketRange, formatDelta } from '@/utils/insightsFormat';
import { hasTrendData, hourLabel } from '@/utils/insightsDetailModels';
import { peakHoursReasonKey } from '@/utils/insightsReasons';
import { parseInsightsWindow } from '@/utils/insightsWindow';
import type { BusinessInsightsWindow } from '@/http/business-api/types';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { InsightsBars } from '../ui/InsightsBars';
import { InsightsHeatmap } from '../ui/InsightsHeatmap';
import {
  CardTitle,
  InsightsTabState,
  SectionInsufficient,
  SourceText,
  isReady,
} from '../ui/InsightsParts';
import { InsightsWindowBar } from '../ui/InsightsWindowBar';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

const HOUR_LABEL_EVERY = 6;
const MIN_TREND_BUCKETS = 3;
const HOUR_LABELS: Record<number, string> = Object.fromEntries(
  Array.from({ length: 24 }, (_, hour) => hour)
    .filter((hour) => hour % HOUR_LABEL_EVERY === 0)
    .map((hour) => [hour, String(hour)]),
);

export default function BusinessHomeDemandDetailPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ window?: string }>();
  const businessId = useBusinessStore((s) => s.businessId);
  const [insightsWindow, setInsightsWindow] = useState<BusinessInsightsWindow>(() =>
    parseInsightsWindow(params.window),
  );

  const query = useBusinessInsightsDetail({ tab: 'demand', businessId, window: insightsWindow });
  const period = t(`businessHome.explore.windowOptions.${insightsWindow}`);

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.explore.detail.demandTitle')}
      onBack={() => router.back()}
      refreshing={query.isRefetching && !query.isPlaceholderData}
      onRefresh={() => void query.refetch()}
    >
      <InsightsWindowBar
        computedAt={query.data?.computed_at}
        window={insightsWindow}
        onChange={setInsightsWindow}
      />
      <InsightsTabState query={query}>
        {(data) => {
          const detail = data.demand_detail;
          const peakHours = data.demand_peak_hours;
          const histogram = isReady(peakHours) ? peakHours.histogram : [];
          const hasHistogram = histogram.length === 24;
          const reason = detail?.heatmap.reason ?? peakHours?.reason;
          const bucketDays = detail?.topics.bucket_days ?? 1;
          return (
            <View className="mt-2.5">
              <BusinessHomeCard>
                <CardTitle>{t('businessHome.explore.detail.topics')}</CardTitle>
                {detail && isReady(detail.topics) ? (
                  <>
                    {detail.topics.rows.map((row, index) => {
                      const delta = formatDelta(row.delta_pct);
                      return (
                        <View
                          key={`${row.source}-${row.query}`}
                          className={`py-2 ${
                            index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
                          }`}
                        >
                          <View className="flex-row items-center gap-2.5">
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
                          {hasTrendData(row.trend) && row.trend.length >= MIN_TREND_BUCKETS ? (
                            <InsightsBars
                              values={row.trend.map((point) => point.count)}
                              height={40}
                              hideHint
                              className="mt-1.5"
                              formatDetail={(i, value) => {
                                const date = formatBucketRange(
                                  row.trend[i]?.start,
                                  bucketDays,
                                  i18n.language,
                                );
                                const text =
                                  value === null || value === undefined
                                    ? t('businessHome.explore.detail.heatmapCellHidden')
                                    : formatCompactNumber(value);
                                return date
                                  ? t('businessHome.explore.detail.trendDetail', { date, value: text })
                                  : text;
                              }}
                            />
                          ) : hasTrendData(row.trend) ? (
                            <Text className="mt-1 font-geist text-[11px] text-gray-500 dark:text-gray-400">
                              {t('businessHome.explore.detail.trendFewBuckets')}
                            </Text>
                          ) : (
                            <Text className="mt-1 font-geist text-[11px] text-gray-500 dark:text-gray-400">
                              {t('businessHome.explore.detail.trendUnavailable')}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                    <SourceText>
                      {[
                        t('businessHome.explore.demandSource', { period }),
                        t('businessHome.explore.detail.trendBucket', { count: bucketDays }),
                        t('businessHome.explore.detail.tapTrendHint'),
                      ].join(' · ')}
                    </SourceText>
                  </>
                ) : (
                  <SectionInsufficient />
                )}
              </BusinessHomeCard>

              <BusinessHomeCard className="mt-2">
                <CardTitle>{t('businessHome.explore.detail.sourcesTitle')}</CardTitle>
                {detail && isReady(detail.sources) ? (
                  <View className="mt-1">
                    {detail.sources.rows.map((row) => (
                      <View key={row.source} className="flex-row justify-between py-1">
                        <Text className="text-xs text-gray-600 dark:text-gray-400">
                          {t(`businessHome.explore.detail.sources.${row.source}`)}
                        </Text>
                        <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
                          {formatCompactNumber(row.volume)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <SectionInsufficient />
                )}
              </BusinessHomeCard>

              <BusinessHomeCard className="mt-2">
                <CardTitle>{t('businessHome.explore.detail.hoursTitle')}</CardTitle>
                {hasHistogram ? (
                  <>
                    <InsightsBars
                      values={histogram}
                      height={64}
                      labels={HOUR_LABELS}
                      className="mt-2"
                      formatDetail={(hour, value) =>
                        t('businessHome.explore.detail.hourDetail', {
                          range: t('businessHome.explore.detail.hourRange', {
                            from: hourLabel(hour),
                            to: hourLabel(hour + 1),
                          }),
                          value: formatCompactNumber(value ?? 0),
                        })
                      }
                    />
                    {peakHours?.timezone ? (
                      <SourceText>
                        {t('businessHome.explore.detail.hoursTimezone', {
                          timezone: peakHours.timezone,
                        })}
                      </SourceText>
                    ) : null}
                  </>
                ) : (
                  <SectionInsufficient messageKey={peakHoursReasonKey(reason)} />
                )}
              </BusinessHomeCard>

              <BusinessHomeCard className="mt-2">
                <CardTitle>{t('businessHome.explore.detail.heatmapTitle')}</CardTitle>
                {detail && isReady(detail.heatmap) && detail.heatmap.cells.length === 7 ? (
                  <>
                    <View className="mt-2">
                      <InsightsHeatmap cells={detail.heatmap.cells} />
                    </View>
                    <SourceText>{t('businessHome.explore.detail.heatmapNote')}</SourceText>
                  </>
                ) : (
                  <SectionInsufficient messageKey={peakHoursReasonKey(reason)} />
                )}
              </BusinessHomeCard>
            </View>
          );
        }}
      </InsightsTabState>
    </BusinessHomeDetailShell>
  );
}
