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
import { formatPeriodLabel, isoFromPickerValue } from '@/utils/dateIso';
import { cn } from '@/utils/cn';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onChange: (range: { dateFrom: string; dateTo: string }) => void;
  displayValue?: string;
  maxDate?: Date;
  minDate?: Date;
}

function toIso(value: DateType): string {
  if (value && typeof value === 'object' && !(value instanceof Date) && 'toDate' in value) {
    return isoFromPickerValue(value.toDate());
  }
  return isoFromPickerValue(value as Date | string | number | null | undefined);
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onChange,
  displayValue,
  maxDate = new Date(),
  minDate,
}: DateRangePickerProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const defaultClassNames = useDefaultClassNames();
  const defaultStyles = useDefaultStyles(colorScheme === 'dark' ? 'dark' : 'light');
  const [visible, setVisible] = useState(false);
  const [draftStart, setDraftStart] = useState(dateFrom);
  const [draftEnd, setDraftEnd] = useState(dateTo);

  useEffect(() => {
    if (visible) {
      setDraftStart(dateFrom);
      setDraftEnd(dateTo);
    }
  }, [visible, dateFrom, dateTo]);

  const shownValue = displayValue ?? formatPeriodLabel(dateFrom, dateTo);
  const canApply = Boolean(draftStart && draftEnd);

  const classNames = useMemo(
    () => ({
      ...defaultClassNames,
      day_label: 'font-geist text-ink dark:text-gray-100',
      month_selector_label: 'font-geist-semibold text-lg text-ink dark:text-gray-100',
      year_selector_label: 'font-geist-semibold text-lg text-ink dark:text-gray-100',
      weekday_label: 'text-xs uppercase text-gray-500 dark:text-gray-400',
      range_fill: 'bg-brand-tint dark:bg-brand-dark',
      selected: 'bg-brand',
      selected_label: 'text-white',
      range_start: 'bg-brand',
      range_end: 'bg-brand',
      range_start_label: 'text-white',
      range_end_label: 'text-white',
      range_middle: 'bg-transparent',
      range_middle_label: 'text-brand-dark dark:text-brand-tint',
      disabled_label: 'text-gray-400 dark:text-gray-500 opacity-50',
      outside_label: 'text-gray-400 dark:text-gray-500',
      today: 'bg-soft dark:bg-gray-800',
      today_label: 'text-ink dark:text-gray-100',
      selected_month: 'bg-brand',
      selected_month_label: 'text-white',
      selected_year: 'bg-brand',
      selected_year_label: 'text-white',
      active_year: 'bg-soft dark:bg-gray-800',
      active_year_label: 'text-ink dark:text-gray-100',
      month_label: 'font-geist text-ink dark:text-gray-100',
      year_label: 'font-geist text-ink dark:text-gray-100',
    }),
    [defaultClassNames],
  );

  const styles = useMemo(
    () => ({
      ...defaultStyles,
      selected: { backgroundColor: '#FF6B1A' },
      selected_label: { color: '#FFFFFF' },
      range_start: { backgroundColor: '#FF6B1A' },
      range_end: { backgroundColor: '#FF6B1A' },
      range_start_label: { color: '#FFFFFF' },
      range_end_label: { color: '#FFFFFF' },
      range_fill: { backgroundColor: colorScheme === 'dark' ? '#c2410c' : '#FFF1E8' },
      range_middle_label: { color: colorScheme === 'dark' ? '#FFF1E8' : '#c2410c' },
    }),
    [colorScheme, defaultStyles],
  );

  function close() {
    setVisible(false);
  }

  function apply() {
    if (!canApply) return;
    onChange({ dateFrom: draftStart, dateTo: draftEnd });
    close();
  }

  return (
    <View>
      <Pressable
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t('businessHome.dateRangePicker.title')}
        className="min-h-[38px] flex-row items-center gap-1 rounded-full border border-gray-200 bg-paper px-3 dark:border-gray-600 dark:bg-gray-800 cursor-pointer"
      >
        <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
          {shownValue}
        </Text>
        <Calendar size={12} color="#78716C" strokeWidth={2} />
        <ChevronDown size={12} color="#78716C" strokeWidth={2.4} />
      </Pressable>

      <Modal
        visible={visible}
        onClose={close}
        title={t('businessHome.dateRangePicker.title')}
      >
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

        <View className="mt-4 flex-row gap-2">
          <LocalNotesButton
            label={t('businessHome.dateRangePicker.cancel')}
            onPress={close}
            variant="light"
            size="sm"
            isRounded
            className="flex-1"
          />
          <LocalNotesButton
            label={t('businessHome.dateRangePicker.apply')}
            onPress={apply}
            variant="brand"
            size="sm"
            isRounded
            disabled={!canApply}
            className={cn('flex-1', !canApply && 'opacity-50')}
          />
        </View>
      </Modal>
    </View>
  );
}
