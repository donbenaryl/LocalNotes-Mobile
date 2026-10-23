import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BusinessInsightsWindow } from '@/http/business-api/types';
import { cn } from '@/utils/cn';

const WINDOWS: BusinessInsightsWindow[] = ['7d', '30d', '90d'];

interface InsightsWindowSelectorProps {
  value: BusinessInsightsWindow;
  onChange: (window: BusinessInsightsWindow) => void;
}

export function InsightsWindowSelector({ value, onChange }: InsightsWindowSelectorProps) {
  const { t } = useTranslation();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('businessHome.explore.windowSelectorLabel')}
      className="flex-row rounded-xl border border-gray-200 bg-paper p-0.5 dark:border-gray-600 dark:bg-gray-800"
    >
      {WINDOWS.map((option) => {
        const isActive = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            className={cn(
              'cursor-pointer rounded-lg px-2.5 py-1',
              isActive && 'bg-ink dark:bg-paper',
            )}
          >
            <Text
              className={cn(
                'font-geist-bold text-xs',
                isActive ? 'text-white dark:text-ink' : 'text-gray-500 dark:text-gray-400',
              )}
            >
              {t(`businessHome.explore.windowOptions.${option}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
