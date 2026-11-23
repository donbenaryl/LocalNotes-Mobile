import { Text, View } from 'react-native';

interface KeyValueRowProps {
  label: string;
  value: string;
  valueClassName?: string;
}

export function KeyValueRow({ label, value, valueClassName }: KeyValueRowProps) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="flex-1 font-geist-semibold text-[13px] text-gray-600 dark:text-dk-muted">
        {label}
      </Text>
      <Text
        className={`font-geist-bold text-[13px] text-ink dark:text-dk-text ${valueClassName ?? ''}`}
      >
        {value}
      </Text>
    </View>
  );
}
