import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { getFeedTimeGroup } from '@/utils/time';
import type { BusinessInsightsWindow } from '@/http/business-api/types';
import { InsightsWindowSelector } from './InsightsWindowSelector';

/** Reuses the feed's time buckets (hours, yesterday, days, then a date). */
function formatUpdatedLabel(t: TFunction, computedAt: string, locale: string): string {
  const group = getFeedTimeGroup(computedAt, new Date(), locale);
  const bucket = group.i18nKey.split('.').pop();
  return t(`businessHome.explore.updated.${bucket}`, group.params);
}

interface InsightsWindowBarProps {
  computedAt: string | null | undefined;
  window: BusinessInsightsWindow;
  onChange: (window: BusinessInsightsWindow) => void;
}

/** "Updated …" label on the left, 7d/30d/90d selector on the right. */
export function InsightsWindowBar({ computedAt, window, onChange }: InsightsWindowBarProps) {
  const { t, i18n } = useTranslation();
  return (
    <View className="mx-4 mt-2.5 flex-row items-center justify-between gap-2">
      <Text
        className="flex-1 font-geist-semibold text-[11px] text-gray-500 dark:text-gray-400"
        numberOfLines={1}
      >
        {computedAt ? formatUpdatedLabel(t, computedAt, i18n.language) : ''}
      </Text>
      <InsightsWindowSelector value={window} onChange={onChange} />
    </View>
  );
}
