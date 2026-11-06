import { View } from 'react-native';
import { cn } from '@/utils/cn';

export type ProgressBarTone = 'brand' | 'warning' | 'danger';

interface ProgressBarProps {
  /** 0-100; values outside the range are clamped. */
  percent: number;
  tone?: ProgressBarTone;
  className?: string;
  accessibilityLabel?: string;
}

const FILL_CLASS: Record<ProgressBarTone, string> = {
  brand: 'bg-brand',
  warning: 'bg-amber-500',
  danger: 'bg-rose-600',
};

/** Track + fill shared by the discovery rows and the AI credits meter / hero. */
export function ProgressBar({
  percent,
  tone = 'brand',
  className,
  accessibilityLabel,
}: ProgressBarProps) {
  const width = Math.min(100, Math.max(0, percent));
  return (
    <View
      className={cn('h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700', className)}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(width) }}
    >
      <View
        className={cn('h-full rounded-full', FILL_CLASS[tone])}
        style={{ width: `${width}%` }}
      />
    </View>
  );
}
