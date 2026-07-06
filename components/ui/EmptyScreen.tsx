import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { FolderOpen } from 'lucide-react-native';
import { cn } from '@/utils/cn';

const DEFAULT_ICON_COLOR = '#D1D5DB';

interface EmptyScreenProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export function EmptyScreen({
  title,
  description,
  icon,
  className,
}: EmptyScreenProps) {
  return (
    <View className={cn('items-center gap-2 py-8', className)}>
      {icon ?? <FolderOpen size={40} color={DEFAULT_ICON_COLOR} />}
      <Text className="font-geist-medium text-sm text-gray-500 dark:text-gray-400">
        {title}
      </Text>
      {description ? (
        <Text className="text-center font-geist text-xs text-gray-400 dark:text-gray-500">
          {description}
        </Text>
      ) : null}
    </View>
  );
}
