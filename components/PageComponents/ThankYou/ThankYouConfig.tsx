import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WhiteBox } from '@/components/ui/WhiteBox';
import { TextInput } from '@/components/ui/TextInput';
import { cn } from '@/utils/cn';

export type ThankYouPercentPreset = 10 | 20 | 30 | 40 | 'custom';

export type ThankYouConfigValues = {
  preset: ThankYouPercentPreset;
  customPercent: number;
  validityDays: number;
};

interface ThankYouConfigProps {
  values: ThankYouConfigValues;
  onChange: (next: Partial<ThankYouConfigValues>) => void;
  /** Resolved percent used for the summary line. */
  percent: number;
}

const PRESETS: Exclude<ThankYouPercentPreset, 'custom'>[] = [10, 20, 30, 40];

export function ThankYouConfig({ values, onChange, percent }: ThankYouConfigProps) {
  const { t } = useTranslation();

  const clampPercent = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) {
      onChange({ customPercent: 1 });
      return;
    }
    const n = Math.min(100, Math.max(1, parseInt(digits, 10)));
    onChange({ customPercent: n });
  };

  const clampDays = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) {
      onChange({ validityDays: 1 });
      return;
    }
    const n = Math.max(1, parseInt(digits, 10));
    onChange({ validityDays: n });
  };

  return (
    <WhiteBox className="gap-3 p-4">
      <Text className="font-geist-extrabold text-base text-ink dark:text-gray-100">
        {t('thankYou.config.title')}
      </Text>

      <Text className="font-geist-medium text-sm text-ink dark:text-gray-200">
        {t('thankYou.config.summary', {
          percent,
          days: values.validityDays,
        })}
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map((value) => {
          const selected = values.preset === value;
          return (
            <Pressable
              key={value}
              onPress={() => onChange({ preset: value })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={cn(
                'cursor-pointer rounded-full px-4 py-2',
                selected
                  ? 'bg-ink dark:bg-gray-100'
                  : 'bg-gray-100 dark:bg-gray-800',
              )}
            >
              <Text
                className={cn(
                  'font-geist-semibold text-sm',
                  selected
                    ? 'text-white dark:text-ink'
                    : 'text-ink dark:text-gray-200',
                )}
              >
                {t(`thankYou.config.percent${value}`)}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => onChange({ preset: 'custom' })}
          accessibilityRole="button"
          accessibilityState={{ selected: values.preset === 'custom' }}
          className={cn(
            'cursor-pointer rounded-full px-4 py-2',
            values.preset === 'custom'
              ? 'bg-ink dark:bg-gray-100'
              : 'bg-gray-100 dark:bg-gray-800',
          )}
        >
          <Text
            className={cn(
              'font-geist-semibold text-sm',
              values.preset === 'custom'
                ? 'text-white dark:text-ink'
                : 'text-ink dark:text-gray-200',
            )}
          >
            {t('thankYou.config.custom')}
          </Text>
        </Pressable>
      </View>

      {values.preset === 'custom' ? (
        <TextInput
          label={t('thankYou.config.customLabel')}
          hint={t('thankYou.config.customHint')}
          value={String(values.customPercent)}
          onChangeText={clampPercent}
          placeholder={t('thankYou.config.customPlaceholder')}
          keyboardType="number-pad"
          maxLength={3}
        />
      ) : null}

      <View className="gap-1.5">
        <TextInput
          label={t('thankYou.config.validityLabel')}
          hint={t('thankYou.config.validityHint')}
          value={String(values.validityDays)}
          onChangeText={clampDays}
          placeholder={t('thankYou.config.validityPlaceholder')}
          keyboardType="number-pad"
          maxLength={4}
        />
        <Text className="font-geist text-xs text-gray-500 dark:text-gray-400">
          {t('thankYou.config.validitySuffix')}
        </Text>
      </View>

      <Text className="font-geist text-sm leading-5 text-gray-500 dark:text-gray-400">
        {t('thankYou.config.helper')}
      </Text>
    </WhiteBox>
  );
}
