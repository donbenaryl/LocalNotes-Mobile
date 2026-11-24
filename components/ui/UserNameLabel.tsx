import { Text, View } from 'react-native';
import { cn } from '@/utils/cn';
import {
  resolveUserLabels,
  type UserNameFields,
} from '@/utils/userDisplayName';

interface UserNameLabelProps {
  user: UserNameFields | null | undefined;
  fallback?: string;
  primaryClassName?: string;
  numberOfLines?: number;
  className?: string;
}

/**
 * Primary username label (real name is ProfileInfo-only).
 */
export function UserNameLabel({
  user,
  fallback,
  primaryClassName,
  numberOfLines = 1,
  className,
}: UserNameLabelProps) {
  const { primary } = resolveUserLabels(user, fallback);

  return (
    <View className={cn('min-w-0', className)}>
      <Text
        className={cn(
          'font-geist-semibold text-ink dark:text-dk-text',
          primaryClassName,
        )}
        numberOfLines={numberOfLines}
      >
        {primary}
      </Text>
    </View>
  );
}
