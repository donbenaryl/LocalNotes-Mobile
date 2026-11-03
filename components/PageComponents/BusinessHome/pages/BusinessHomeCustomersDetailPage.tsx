import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { useBusinessCustomersDetail } from '@/hooks/useBusinessCustomersDetail';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { formatCompactNumber } from '@/utils/formatCompactNumber';
import { getBusinessPersonalityLabel } from '@/utils/businessPersonalityLabels';
import { mergePages } from '@/utils/insightsPagination';
import { parseInsightsWindow } from '@/utils/insightsWindow';
import type { BusinessInsightsWindow } from '@/http/business-api/types';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import {
  CardTitle,
  ChipRow,
  InsightsTabState,
  SectionInsufficient,
  SourceText,
  isReady,
} from '../ui/InsightsParts';
import { InsightsWindowBar } from '../ui/InsightsWindowBar';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

/** Chips arrive sorted by lift; the strongest ones get the brand highlight. */
const HIGHLIGHTED_DIFFERENTIATORS = 2;

export default function BusinessHomeCustomersDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ window?: string }>();
  const businessId = useBusinessStore((s) => s.businessId);
  const [insightsWindow, setInsightsWindow] = useState<BusinessInsightsWindow>(() =>
    parseInsightsWindow(params.window),
  );

  const query = useBusinessCustomersDetail(businessId, insightsWindow);
  const first = query.data?.pages[0];
  const detail = first?.customer_detail ?? null;
  const keywords = detail?.keywords;

  const chips = useMemo(
    () => mergePages(query.data?.pages.map((page) => page.customer_detail?.keywords.chips) ?? [], (c) => c.label),
    [query.data],
  );

  const period = t(`businessHome.explore.windowOptions.${insightsWindow}`);
  const adapted = {
    data: first,
    isPending: query.isPending,
    isError: query.isError && !query.isFetchNextPageError,
    isPlaceholderData: query.isPlaceholderData,
    refetch: query.refetch,
  };

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.explore.detail.customersTitle')}
      onBack={() => router.back()}
      refreshing={query.isRefetching && !query.isPlaceholderData && !query.isFetchingNextPage}
      onRefresh={() => void query.refetch()}
    >
      <InsightsWindowBar
        computedAt={first?.computed_at}
        window={insightsWindow}
        onChange={setInsightsWindow}
      />
      <InsightsTabState query={adapted}>
        {() => (
          <View className="mt-2.5">
            <BusinessHomeCard>
              <CardTitle>{t('businessHome.explore.whatCustomersSay')}</CardTitle>
              {keywords && isReady(keywords) && chips.length > 0 ? (
                <>
                  <ChipRow
                    chips={chips.map((chip) => ({
                      label: chip.label,
                      count: formatCompactNumber(chip.count),
                      hot: chip.hot,
                    }))}
                  />
                  <SourceText>
                    {t('businessHome.explore.detail.keywordsShown', {
                      shown: chips.length,
                      total: keywords.total,
                    })}
                    {' · '}
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
                  {query.hasNextPage ? (
                    <LocalNotesButton
                      label={t(
                        query.isFetchingNextPage
                          ? 'businessHome.explore.detail.loadingMore'
                          : 'businessHome.explore.detail.loadMore',
                      )}
                      onPress={() => void query.fetchNextPage()}
                      disabled={query.isFetchingNextPage}
                      variant="light"
                      size="xs"
                      isWidthFull={false}
                      className="mt-2 self-start"
                    />
                  ) : null}
                </>
              ) : (
                <SectionInsufficient />
              )}
            </BusinessHomeCard>

            <BusinessHomeCard className="mt-2">
              <CardTitle>{t('businessHome.explore.whoTheyAre')}</CardTitle>
              {detail && isReady(detail.personality) ? (
                <>
                  <View className="mt-2 h-2 flex-row overflow-hidden rounded-full">
                    {detail.personality.rows.map((row) => (
                      <View
                        key={row.color}
                        style={{ width: `${row.percentage}%`, backgroundColor: row.color }}
                      />
                    ))}
                  </View>
                  <View className="mt-2 gap-1">
                    {detail.personality.rows.map((row) => (
                      <View key={row.color} className="flex-row items-center gap-2">
                        <View
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <Text className="flex-1 font-geist-bold text-xs text-ink dark:text-gray-100">
                          {Math.round(row.percentage)}% {getBusinessPersonalityLabel(row.color_name)}
                        </Text>
                        {typeof row.user_count === 'number' ? (
                          <Text className="font-geist-semibold text-xs text-gray-500">
                            {t('businessHome.explore.detail.personalityCount', {
                              count: row.user_count,
                            })}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                  <SourceText>
                    {[
                      t('businessHome.explore.personalitySource', {
                        count: formatCompactNumber(detail.personality.cohort_size),
                        period,
                      }),
                      detail.personality.top_area
                        ? t('businessHome.explore.personalityTopArea', {
                            area: detail.personality.top_area,
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
            </BusinessHomeCard>

            <BusinessHomeCard className="mt-2">
              <CardTitle>{t('businessHome.explore.whatMakesDifferent')}</CardTitle>
              {detail && isReady(detail.differentiators) ? (
                <>
                  <ChipRow
                    chips={detail.differentiators.chips.map((chip, index) => ({
                      label: chip.label,
                      count: `${chip.lift}×`,
                      hot: index < HIGHLIGHTED_DIFFERENTIATORS,
                    }))}
                  />
                  <SourceText>
                    {t('businessHome.explore.diffSource', {
                      peers: detail.differentiators.peer_count,
                      label: detail.differentiators.peer_label ?? '',
                      period,
                    })}
                  </SourceText>
                </>
              ) : (
                <SectionInsufficient />
              )}
            </BusinessHomeCard>
          </View>
        )}
      </InsightsTabState>
    </BusinessHomeDetailShell>
  );
}
