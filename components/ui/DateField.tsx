import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { formatIsoDate, parseIsoDate } from '@/utils/dateIso';

interface DateFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  max?: Date;
  placeholder?: string;
  displayValue?: string;
  variant?: 'default' | 'compact';
}

export function DateField({
  label,
  value,
  onChange,
  error,
  max = new Date(),
  placeholder = 'Select date',
  displayValue,
  variant = 'default',
}: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = parseIsoDate(value);

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'dismissed' || !date) {
      return;
    }

    onChange(formatIsoDate(date));
  }

  const isCompact = variant === 'compact';
  const shownValue = displayValue ?? value;

  return (
    <View className={isCompact ? undefined : 'w-full'}>
      {label ? (
        <Text className="text-gray-500 dark:text-gray-200 font-geist-medium text-sm mb-1.5 capitalize">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        className={
          isCompact
            ? `min-h-[38px] flex-row items-center gap-1 rounded-full border bg-paper px-3 dark:bg-gray-800 ${
                error ? 'border-error' : 'border-gray-200 dark:border-gray-600'
              }`
            : `flex-row items-center bg-gray-50 dark:bg-gray-800 border rounded-xl px-4 h-14 cursor-pointer ${
                error ? 'border-error' : 'border-gray-100 dark:border-gray-700'
              }`
        }
      >
        <Text
          className={
            isCompact
              ? `font-geist-bold text-xs ${
                  shownValue
                    ? 'text-ink dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500'
                }`
              : `flex-1 font-geist text-base ${
                  value
                    ? 'text-ink dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-500'
                }`
          }
        >
          {shownValue || placeholder}
        </Text>
        <Calendar size={isCompact ? 12 : 18} color="#78716C" strokeWidth={2} />
      </Pressable>

      {error ? (
        <Text className="text-error text-xs mt-1 font-geist">{error}</Text>
      ) : null}

      {showPicker ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={max}
          onChange={handleChange}
        />
      ) : null}

      {Platform.OS === 'ios' && showPicker ? (
        <Pressable
          onPress={() => setShowPicker(false)}
          className="mt-2 self-end cursor-pointer"
        >
          <Text className="font-geist-semibold text-brand text-sm">Done</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
