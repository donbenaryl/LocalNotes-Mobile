import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { barHeights } from '@/utils/insightsCharts';
import { cn } from '@/utils/cn';

interface InsightsBarsProps {
  values: (number | null | undefined)[];
  /** Height in px of the tallest bar. */
  height: number;
  /** Optional labels keyed by bar index (e.g. the hour every 6th bar). */
  labels?: Record<number, string>;
  /** When set, bars become tappable and the returned text is shown as the readout. */
  formatDetail?: (index: number, value: number | null | undefined) => string;
  /** Hide the "tap a bar" hint when nothing is selected (caller explains it once). */
  hideHint?: boolean;
  className?: string;
  accessibilityLabel?: string;
}

/** Simple NativeWind bar chart; no chart library. */
export function InsightsBars({
  values,
  height,
  labels,
  formatDetail,
  hideHint,
  className,
  accessibilityLabel,
}: InsightsBarsProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const heights = barHeights(values, height);
  const active = selected !== null && selected < values.length ? selected : null;
  return (
    <View className={className} accessibilityLabel={accessibilityLabel}>
      {formatDetail && !(hideHint && active === null) ? (
        <Text
          numberOfLines={1}
          className="mb-1 font-geist-semibold text-xs text-gray-600 dark:text-gray-300"
        >
          {active !== null
            ? formatDetail(active, values[active])
            : t('businessHome.explore.detail.tapForDetails')}
        </Text>
      ) : null}
      <View className="flex-row items-end gap-0.5" style={{ height }}>
        {heights.map((h, index) => {
          const bar = (
            <View
              className={cn(
                'w-full rounded-t-sm',
                h > 0
                  ? 'bg-brand'
                  : values[index] == null
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-soft dark:bg-gray-700',
                active !== null && active !== index && 'opacity-40',
              )}
              style={{ height: Math.max(h, 2) }}
            />
          );
          return formatDetail ? (
            <Pressable
              key={index}
              className="h-full flex-1 justify-end"
              accessibilityRole="button"
              accessibilityLabel={formatDetail(index, values[index])}
              accessibilityState={{ selected: active === index }}
              onPress={() => setSelected((prev) => (prev === index ? null : index))}
            >
              {bar}
            </Pressable>
          ) : (
            <View key={index} className="flex-1">
              {bar}
            </View>
          );
        })}
      </View>
      {labels ? (
        <View className="mt-1 flex-row gap-0.5">
          {values.map((_, index) => (
            <View key={index} className="flex-1 items-start">
              {labels[index] ? (
                <Text
                  numberOfLines={1}
                  className="font-geist text-[9px] text-gray-500 dark:text-gray-400"
                >
                  {labels[index]}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
