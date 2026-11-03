import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useBusinessInsightsDetail } from '@/hooks/useBusinessInsightsDetail';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { formatCompactNumber } from '@/utils/formatCompactNumber';
import { formatBucketRange, formatDelta } from '@/utils/insightsFormat';
import { peerRangePosition, topPercentValue } from '@/utils/insightsDetailModels';
import { parseInsightsWindow } from '@/utils/insightsWindow';
import type {
  BusinessInsightsWindow,
  BusinessPerformanceSeriesKey,
} from '@/http/business-api/types';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { InsightsBars } from '../ui/InsightsBars';
import {
  CardTitle,
  InsightsTabState,
  SectionInsufficient,
  SourceText,
  isReady,
} from '../ui/InsightsParts';
import { InsightsWindowBar } from '../ui/InsightsWindowBar';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

const SERIES_ORDER: BusinessPerformanceSeriesKey[] = ['views', 'saves', 'follows', 'shares'];

export default function BusinessHomePerformanceDetailPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ window?: string }>();
  const businessId = useBusinessStore((s) => s.businessId);
  const [insightsWindow, setInsightsWindow] = useState<BusinessInsightsWindow>(() =>
    parseInsightsWindow(params.window),
  );

  const query = useBusinessInsightsDetail({
    tab: 'performance',
    businessId,
    window: insightsWindow,
  });
  const period = t(`businessHome.explore.windowOptions.${insightsWindow}`);

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.explore.detail.performanceTitle')}
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
          const detail = data.performance_detail;
          if (!detail || !isReady(detail)) {
            return (
              <BusinessHomeCard className="mt-2.5">
                <SectionInsufficient />
              </BusinessHomeCard>
            );
          }
          const metrics = SERIES_ORDER.flatMap((key) => {
            const metric = detail.metrics.find((m) => m.key === key);
            return metric ? [metric] : [];
          });
          const audienceFit = detail.audience_fit;
          const bucketDays = detail.series_bucket_days ?? 1;
          return (
            <View className="mt-2.5">
              {metrics.map((metric, index) => {
                const label = t(`businessHome.explore.performanceMetrics.${metric.key}`);
                const points = detail.series[metric.key] ?? [];
                const delta = formatDelta(metric.delta);
                const top = topPercentValue(metric.percentile);
                const peers = detail.peers?.[metric.key] ?? null;
                const ownPos = peerRangePosition(metric.value, peers);
                const medianPos = peers ? peerRangePosition(peers.median, peers) : null;
                return (
                  <BusinessHomeCard key={metric.key} className={index > 0 ? 'mt-2' : undefined}>
                    <View className="flex-row items-center justify-between gap-2">
                      <CardTitle>{label}</CardTitle>
                      <Text className="font-geist-semibold text-xs text-gray-500">
                        {[
                          t('businessHome.explore.detail.seriesTotal', {
                            value: formatCompactNumber(metric.value),
                          }),
                          top !== null
                            ? t('businessHome.explore.topPercent', { percent: top })
                            : null,
                          delta,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                    <InsightsBars
                      values={points.map((point) => point.value)}
                      height={48}
                      className="mt-2"
                      formatDetail={(pointIndex, value) => {
                        const formatted = formatCompactNumber(value ?? 0);
                        const date = formatBucketRange(
                          points[pointIndex]?.start,
                          bucketDays,
                          i18n.language,
                        );
                        return date
                          ? t('businessHome.explore.detail.seriesPointDetail', {
                              date,
                              value: formatted,
                            })
                          : formatted;
                      }}
                    />
                    {peers && ownPos !== null ? (
                      <View className="mt-3">
                        <View className="h-1.5 rounded-full bg-soft dark:bg-gray-700">
                          {medianPos !== null ? (
                            <View
                              className="absolute top-0 h-1.5 w-0.5 bg-gray-400"
                              style={{ left: `${medianPos * 100}%` }}
                            />
                          ) : null}
                          <View
                            className="absolute -top-1 h-3.5 w-3.5 rounded-full bg-brand"
                            style={{ left: `${ownPos * 100}%`, marginLeft: -7 }}
                            accessibilityLabel={t('businessHome.explore.detail.you')}
                          />
                        </View>
                        <SourceText>
                          {[
                            t('businessHome.explore.detail.peerRange', {
                              min: formatCompactNumber(peers.min),
                              max: formatCompactNumber(peers.max),
                            }),
                            t('businessHome.explore.detail.peerMedian', {
                              median: formatCompactNumber(peers.median),
                            }),
                          ].join(' · ')}
                        </SourceText>
                      </View>
                    ) : null}
                  </BusinessHomeCard>
                );
              })}

              {audienceFit ? (
                <BusinessHomeCard className="mt-2">
                  <View className="flex-row items-center justify-between gap-2">
                    <CardTitle>{t('businessHome.explore.detail.audienceFitTitle')}</CardTitle>
                    <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
                      {`${Math.round(audienceFit.value)}%`}
                    </Text>
                  </View>
                  {audienceFit.peer_avg !== null ? (
                    <SourceText>
                      {t('businessHome.explore.performanceRow', {
                        metric: t('businessHome.explore.performanceMetrics.audience_fit'),
                        value: `${Math.round(audienceFit.value)}%`,
                        peer: `${Math.round(audienceFit.peer_avg)}%`,
                      })}
                    </SourceText>
                  ) : null}
                </BusinessHomeCard>
              ) : null}

              <View className="mx-4">
                <SourceText>
                  {[
                    detail.peers && detail.peer_count
                      ? t('businessHome.explore.performanceSource', {
                          peers: detail.peer_count,
                          label: detail.peer_label ?? '',
                          period,
                        })
                      : t('businessHome.explore.detail.noPeers'),
                    t('businessHome.explore.detail.seriesBucket', { count: bucketDays }),
                  ].join(' · ')}
                </SourceText>
              </View>
            </View>
          );
        }}
      </InsightsTabState>
    </BusinessHomeDetailShell>
  );
}
