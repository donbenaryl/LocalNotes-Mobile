import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChartColumn } from 'lucide-react-native';
import { SavedSectionState } from '@/components/PageComponents/Saved/SavedSectionState';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import type { BusinessInsightStatus } from '@/http/business-api/types';
import { BusinessHomeCard } from './BusinessHomeCard';

/** The slice of a TanStack query result each tab needs. */
export interface InsightsTabQuery<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  isPlaceholderData: boolean;
  refetch: () => unknown;
}

export function isReady<T extends { status: BusinessInsightStatus }>(
  section: T | null,
): section is T {
  return section?.status === 'ready';
}

export function ChipRow({
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

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="font-geist-extrabold text-sm text-ink dark:text-gray-100">{children}</Text>
  );
}

export function SourceText({ children }: { children: ReactNode }) {
  return (
    <Text className="mt-2 font-geist-semibold text-[11px] text-gray-500 dark:text-gray-400">
      {children}
    </Text>
  );
}

export function SectionInsufficient({ messageKey }: { messageKey?: string }) {
  const { t } = useTranslation();
  return (
    <Text className="mt-2 font-geist text-xs text-gray-500 dark:text-gray-400">
      {t(messageKey ?? 'businessHome.explore.insufficientData')}
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

export function InsightsTabState<T extends { status: BusinessInsightStatus }>({
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
