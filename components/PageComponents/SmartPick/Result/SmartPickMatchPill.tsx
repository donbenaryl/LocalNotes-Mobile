import { Text, View } from 'react-native';
import { getMatchLabel } from '@/utils/smartPick';

interface SmartPickMatchPillProps {
  percent: number | null;
  isStretch: boolean;
  /** Compact mode drops the label text, showing just the percentage (used on backup rows). */
  compact?: boolean;
}

export function SmartPickMatchPill({ percent, isStretch, compact }: SmartPickMatchPillProps) {
  if (percent == null) return null;

  const colorClass = isStretch ? 'bg-connector/10 text-connector dark:text-connector' : 'bg-explorer/10 text-explorer dark:text-explorer';
  const [bgClass, textClass] = colorClass.split(' ');

  return (
    <View className={`rounded-full px-2.5 py-1 dark:bg-gray-800 bg-white ${bgClass}`}>
      <Text className={`font-geist-bold text-[11px] ${textClass}`}>
        {Math.round(percent)}%{compact ? '' : ` ${getMatchLabel(percent)}`}
      </Text>
    </View>
  );
}
