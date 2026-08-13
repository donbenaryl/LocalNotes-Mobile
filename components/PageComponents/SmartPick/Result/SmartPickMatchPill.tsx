import { Text, View } from 'react-native';
import { getMatchPercentColor } from '@/utils/matchScore';
import { getMatchLabel } from '@/utils/smartPick';

interface SmartPickMatchPillProps {
  percent: number | null;
  /** Compact mode drops the label text, showing just the percentage (used on backup rows). */
  compact?: boolean;
}

export function SmartPickMatchPill({ percent, compact }: SmartPickMatchPillProps) {
  if (percent == null) return null;

  const color = getMatchPercentColor(percent);

  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{ backgroundColor: `${color}1A` }}
    >
      <Text className="font-geist-bold text-[11px]" style={{ color }}>
        {Math.round(percent)}%{compact ? '' : ` ${getMatchLabel(percent)}`}
      </Text>
    </View>
  );
}
