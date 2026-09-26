import { Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

export interface BusinessHomeStatsGridItem {
  value: string;
  label: string;
  change: number;
}

interface BusinessHomeStatsGridProps {
  items: BusinessHomeStatsGridItem[];
  className?: string;
}

function formatChange(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change}%`;
}

export function BusinessHomeStatsGrid({
  items,
  className,
}: BusinessHomeStatsGridProps) {
  return (
    <View className={cn('flex-row flex-wrap gap-2.5', className)}>
      {items.map((item, index) => {
        const isPositive = item.change > 0;

        return (
          <View
            key={`${item.label}-${index}`}
            className="min-w-0 flex-grow basis-[47%] rounded-2xl border border-gray-200 bg-white px-4 py-3.5 dark:border-gray-800 dark:bg-gray-800"
          >
            <Text className="font-geist-extrabold text-2xl text-ink dark:text-gray-100">
              {item.value}
            </Text>
            <Text className="mt-0.5 font-geist-semibold text-sm text-gray-500 dark:text-gray-400">
              {item.label}
            </Text>
            <Badge
              label={formatChange(item.change)}
              variant={isPositive ? 'success' : 'secondary'}
              className="mt-2.5"
            />
          </View>
        );
      })}
    </View>
  );
}
