import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { formatCompactNumber } from '@/utils/formatCompactNumber';
import { gridMax, heatmapIntensity } from '@/utils/insightsCharts';
import { hourLabel, weekdayLabel, weekdayLongLabel } from '@/utils/insightsDetailModels';

interface InsightsHeatmapProps {
  /** 7 weekdays (Monday first) x 24 hours; null cells are under the privacy threshold. */
  cells: (number | null)[][];
}

interface SelectedCell {
  day: number;
  hour: number;
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const HOUR_LABEL_EVERY = 6;

/** Day x hour grid; opacity carries the intensity so it works in light and dark mode. */
export function InsightsHeatmap({ cells }: InsightsHeatmapProps) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<SelectedCell | null>(null);
  const max = gridMax(cells);

  const describe = (day: number, hour: number): string => {
    const value = cells[day]?.[hour] ?? null;
    const detail =
      value === null
        ? t('businessHome.explore.detail.heatmapCellHidden')
        : value > 0
          ? formatCompactNumber(value)
          : t('businessHome.explore.detail.noActivity');
    return t('businessHome.explore.detail.heatmapDetail', {
      day: weekdayLongLabel(day, i18n.language),
      range: t('businessHome.explore.detail.hourRange', {
        from: hourLabel(hour),
        to: hourLabel(hour + 1),
      }),
      value: detail,
    });
  };

  return (
    <View>
      <Text
        numberOfLines={1}
        className="mb-1.5 font-geist-semibold text-xs text-gray-600 dark:text-gray-300"
      >
        {selected
          ? describe(selected.day, selected.hour)
          : t('businessHome.explore.detail.tapCellForDetails')}
      </Text>
      {cells.map((row, dayIndex) => (
        <View key={dayIndex} className="mb-0.5 flex-row items-center gap-0.5">
          <Text className="w-4 font-geist-semibold text-[9px] text-gray-500 dark:text-gray-400">
            {weekdayLabel(dayIndex, i18n.language)}
          </Text>
          {HOURS.map((hour) => {
            const value = row[hour] ?? null;
            const intensity = heatmapIntensity(value, max);
            const isSelected = selected?.day === dayIndex && selected.hour === hour;
            return (
              <Pressable
                key={hour}
                className="flex-1"
                hitSlop={2}
                accessibilityRole="button"
                accessibilityLabel={describe(dayIndex, hour)}
                accessibilityState={{ selected: isSelected }}
                onPress={() =>
                  setSelected((prev) =>
                    prev?.day === dayIndex && prev.hour === hour
                      ? null
                      : { day: dayIndex, hour },
                  )
                }
              >
                <View
                  className={cn(
                    'h-3.5 rounded-sm border',
                    intensity > 0 ? 'bg-brand' : 'bg-soft dark:bg-gray-700',
                    isSelected ? 'border-ink dark:border-white' : 'border-transparent',
                  )}
                  style={intensity > 0 ? { opacity: 0.2 + 0.8 * intensity } : undefined}
                />
              </Pressable>
            );
          })}
        </View>
      ))}
      <View className="flex-row gap-0.5 pl-[18px]">
        {HOURS.map((hour) => (
          <View key={hour} className="flex-1 items-start">
            {hour % HOUR_LABEL_EVERY === 0 ? (
              <Text className="font-geist text-[9px] text-gray-500 dark:text-gray-400">{hour}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
