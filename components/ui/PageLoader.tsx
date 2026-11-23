import { ActivityIndicator, Text, View } from 'react-native';
import { BRAND } from '@/constants/colors';
import { cn } from '@/utils/cn';

interface PageLoaderProps {
  /** Default: true — flex-1 page background, centered spinner */
  fullPage?: boolean;
  size?: 'small' | 'large';
  /** Optional text below spinner (e.g. personality "analyzing") */
  message?: string;
  className?: string;
}

export function PageLoader({
  fullPage = true,
  size = 'large',
  message,
  className,
}: PageLoaderProps) {
  const spinner = <ActivityIndicator size={size} color={BRAND} />;

  if (!fullPage) {
    return spinner;
  }

  return (
    <View
      className={cn(
        'flex-1 bg-page dark:bg-dk-page items-center justify-center',
        className,
      )}
    >
      {spinner}
      {message ? (
        <Text className="font-geist text-sm text-gray-500 dark:text-dk-muted mt-4">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
