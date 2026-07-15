import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';

interface DateFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  max?: Date;
  placeholder?: string;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value: string): Date {
  if (!value) return new Date(2000, 0, 1);
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date(2000, 0, 1);
  return new Date(year, month - 1, day);
}

export function DateField({
  label,
  value,
  onChange,
  error,
  max = new Date(),
  placeholder = 'Select date',
}: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = parseDate(value);

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'dismissed' || !date) {
      return;
    }

    onChange(formatDate(date));
  }

  return (
    <View className="w-full">
      {label ? (
        <Text className="text-gray-500 dark:text-gray-200 font-geist-medium text-sm mb-1.5 capitalize">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setShowPicker(true)}
        className={`flex-row items-center bg-gray-50 dark:bg-gray-800 border rounded-xl px-4 h-14 cursor-pointer ${
          error ? 'border-error' : 'border-gray-100 dark:border-gray-700'
        }`}
      >
        <Text
          className={`flex-1 font-geist text-base ${
            value
              ? 'text-ink dark:text-gray-100'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {value || placeholder}
        </Text>
        <Calendar size={18} color="#6B7280" strokeWidth={2} />
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
