import { ActivityIndicator, Text, View } from 'react-native';
import { cn } from '@/utils/cn';

const BRAND_COLOR = '#FF6B1A';

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
  const spinner = <ActivityIndicator size={size} color={BRAND_COLOR} />;

  if (!fullPage) {
    return spinner;
  }

  return (
    <View
      className={cn(
        'flex-1 bg-page dark:bg-gray-900 items-center justify-center',
        className,
      )}
    >
      {spinner}
      {message ? (
        <Text className="font-geist text-sm text-gray-500 dark:text-gray-400 mt-4">
          {message}
        </Text>
      ) : null}
    </View>
  );
}
