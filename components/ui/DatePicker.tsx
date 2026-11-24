import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { Calendar, ChevronDown } from 'lucide-react-native';
import DateTimePicker, {
  useDefaultClassNames,
  useDefaultStyles,
  type DateType,
} from 'react-native-ui-datepicker';
import { Modal } from '@/components/ui/Modal';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { BRAND, BRAND_DARK, BRAND_ON_DARK, BRAND_TINT } from '@/constants/colors';
import { formatPeriodLabel, isoFromPickerValue } from '@/utils/dateIso';
import { cn } from '@/utils/cn';

type DatePickerBase = {
  displayValue?: string;
  maxDate?: Date;
  minDate?: Date;
  variant?: 'default' | 'compact';
  label?: string;
  error?: string;
  placeholder?: string;
  title?: string;
};

type SingleDatePickerProps = DatePickerBase & {
  mode?: 'single';
  value: string;
  onChange: (value: string) => void;
  dateFrom?: never;
  dateTo?: never;
};

type RangeDatePickerProps = DatePickerBase & {
  mode: 'range';
  dateFrom: string;
  dateTo: string;
  onChange: (range: { dateFrom: string; dateTo: string }) => void;
  value?: never;
};

export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

function toIso(value: DateType): string {
  if (value && typeof value === 'object' && !(value instanceof Date) && 'toDate' in value) {
    return isoFromPickerValue(value.toDate());
  }
  return isoFromPickerValue(value as Date | string | number | null | undefined);
}

export function DatePicker(props: DatePickerProps) {
  const {
    displayValue,
    maxDate = new Date(),
    minDate,
    variant,
    label,
    error,
    placeholder = 'Select date',
    title,
  } = props;

  const isRange = props.mode === 'range';
  const resolvedVariant = variant ?? (isRange ? 'compact' : 'default');
  const isCompact = resolvedVariant === 'compact';

  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const defaultClassNames = useDefaultClassNames();
  const defaultStyles = useDefaultStyles(colorScheme === 'dark' ? 'dark' : 'light');

  const [visible, setVisible] = useState(false);
  const [draftSingle, setDraftSingle] = useState(isRange ? '' : props.value);
  const [draftStart, setDraftStart] = useState(isRange ? props.dateFrom : '');
  const [draftEnd, setDraftEnd] = useState(isRange ? props.dateTo : '');

  const value = isRange ? undefined : props.value;
  const dateFrom = isRange ? props.dateFrom : undefined;
  const dateTo = isRange ? props.dateTo : undefined;

  useEffect(() => {
    if (!visible) return;
    if (isRange) {
      setDraftStart(dateFrom ?? '');
      setDraftEnd(dateTo ?? '');
    } else {
      setDraftSingle(value ?? '');
    }
  }, [visible, isRange, value, dateFrom, dateTo]);

  const shownValue = isRange
    ? (displayValue ?? formatPeriodLabel(props.dateFrom, props.dateTo))
    : (displayValue ?? props.value);

  const canApply = isRange
    ? Boolean(draftStart && draftEnd)
    : Boolean(draftSingle);

  const modalTitle =
    title ??
    (isRange
      ? t('businessHome.dateRangePicker.title')
      : (label ?? t('common.datePicker.title')));

  const accessibilityLabel = isRange
    ? t('businessHome.dateRangePicker.title')
    : (label ?? modalTitle);

  const classNames = useMemo(
    () => ({
      ...defaultClassNames,
      day_label: 'font-geist text-ink dark:text-dk-text',
      month_selector_label: 'font-geist-semibold text-lg text-ink dark:text-dk-text',
      year_selector_label: 'font-geist-semibold text-lg text-ink dark:text-dk-text',
      weekday_label: 'text-xs uppercase text-gray-500 dark:text-dk-muted',
      range_fill: 'bg-brand-tint dark:bg-brand-dark',
      selected: 'bg-brand',
      selected_label: 'text-white',
      range_start: 'bg-brand',
      range_end: 'bg-brand',
      range_start_label: 'text-white',
      range_end_label: 'text-white',
      range_middle: 'bg-transparent',
      range_middle_label: 'text-brand-dark dark:text-dk-text dark:text-brand-tint',
      disabled_label: 'text-gray-400 dark:text-dk-faint opacity-50',
      outside_label: 'text-gray-400 dark:text-dk-faint',
      today: 'bg-soft dark:bg-dk-card',
      today_label: 'text-ink dark:text-dk-text',
      selected_month: 'bg-brand',
      selected_month_label: 'text-white',
      selected_year: 'bg-brand',
      selected_year_label: 'text-white',
      active_year: 'bg-soft dark:bg-dk-card',
      active_year_label: 'text-ink dark:text-dk-text',
      month_label: 'font-geist text-ink dark:text-dk-text',
      year_label: 'font-geist text-ink dark:text-dk-text',
    }),
    [defaultClassNames],
  );

  const styles = useMemo(
    () => ({
      ...defaultStyles,
      selected: { backgroundColor: BRAND },
      selected_label: { color: '#FFFFFF' },
      range_start: { backgroundColor: BRAND },
      range_end: { backgroundColor: BRAND },
      range_start_label: { color: '#FFFFFF' },
      range_end_label: { color: '#FFFFFF' },
      range_fill: {
        backgroundColor: colorScheme === 'dark' ? BRAND_DARK : BRAND_TINT,
      },
      range_middle_label: {
        color: colorScheme === 'dark' ? BRAND_ON_DARK : BRAND_DARK,
      },
    }),
    [colorScheme, defaultStyles],
  );

  function close() {
    setVisible(false);
  }

  function apply() {
    if (!canApply) return;
    if (isRange) {
      props.onChange({ dateFrom: draftStart, dateTo: draftEnd });
    } else {
      props.onChange(draftSingle);
    }
    close();
  }

  return (
    <View className={isCompact ? undefined : 'w-full'}>
      {label ? (
        <Text className="text-gray-500 dark:text-dk-body font-geist-medium text-sm mb-1.5 capitalize">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className={
          isCompact
            ? cn(
                'min-h-[30px] flex-row items-center gap-1 rounded-xl border bg-paper px-3 dark:bg-dk-card cursor-pointer',
                error ? 'border-error' : 'border-gray-200 dark:border-dk-border',
              )
            : cn(
                'flex-row items-center bg-gray-50 dark:bg-dk-card border rounded-xl px-4 h-14 cursor-pointer',
                error ? 'border-error' : 'border-gray-100 dark:border-dk-border',
              )
        }
      >
        <Text
          className={
            isCompact
              ? cn(
                  'font-geist-bold text-xs',
                  shownValue
                    ? 'text-ink dark:text-dk-text'
                    : 'text-gray-400 dark:text-dk-faint',
                )
              : cn(
                  'flex-1 font-geist text-base',
                  shownValue
                    ? 'text-ink dark:text-dk-text'
                    : 'text-gray-400 dark:text-dk-faint',
                )
          }
        >
          {shownValue || placeholder}
        </Text>
        <Calendar size={isCompact ? 12 : 18} color="#78716C" strokeWidth={2} />
        {isRange ? (
          <ChevronDown size={12} color="#78716C" strokeWidth={2.4} />
        ) : null}
      </Pressable>

      {error ? (
        <Text className="text-error text-xs mt-1 font-geist">{error}</Text>
      ) : null}

      <Modal visible={visible} onClose={close} title={modalTitle}>
        {isRange ? (
          <DateTimePicker
            mode="range"
            startDate={draftStart || undefined}
            endDate={draftEnd || undefined}
            onChange={({ startDate, endDate }) => {
              setDraftStart(toIso(startDate));
              setDraftEnd(toIso(endDate));
            }}
            minDate={minDate}
            maxDate={maxDate}
            allowRangeReset
            classNames={classNames}
            styles={styles}
          />
        ) : (
          <DateTimePicker
            mode="single"
            date={draftSingle || undefined}
            onChange={({ date }) => {
              setDraftSingle(toIso(date));
            }}
            minDate={minDate}
            maxDate={maxDate}
            classNames={classNames}
            styles={styles}
          />
        )}

        <View className="mt-4 flex-row gap-2">
          <LocalNotesButton
            label={t('common.cancel')}
            onPress={close}
            variant="light"
            size="sm"
            className="flex-1"
          />
          <LocalNotesButton
            label={t('common.apply')}
            onPress={apply}
            variant="brand"
            size="sm"
            disabled={!canApply}
            className={cn('flex-1', !canApply && 'opacity-50')}
          />
        </View>
      </Modal>
    </View>
  );
}
